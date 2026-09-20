'use node';

// The Telegram content-editing bot: takes one incoming message's text,
// runs an OpenAI function-calling loop against the tools in
// openaiTools.ts, executes the corresponding GitHub Contents API /
// Convex calls, and replies back to the same Telegram chat. No
// conversation memory is kept across messages (out of scope per spec) —
// each call to handleMessage is a fresh turn.

import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { SYSTEM_PROMPT, TOOLS } from './openaiTools';
import {
  listResourceSlugs,
  readResourceFile,
  writeResourceFile,
  archiveResource,
} from './lib/github';
import { sendTelegramMessage } from './lib/telegram';

type ToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

async function callOpenAI(messages: unknown[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function runTool(ctx: any, name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case 'list_resources': {
      const slugs = await listResourceSlugs();
      return JSON.stringify({ slugs });
    }
    case 'get_resource': {
      const file = await readResourceFile(args.slug);
      if (!file) return JSON.stringify({ found: false });
      return JSON.stringify({ found: true, content: file.content });
    }
    case 'create_or_update_resource': {
      await writeResourceFile(
        args.slug,
        {
          title: args.title,
          type: args.type,
          access: args.access,
          url: args.url,
          category: args.category,
          description: args.description,
          aliases: args.aliases,
          status: args.status,
        },
        args.commit_message
      );
      return JSON.stringify({ ok: true, slug: args.slug });
    }
    case 'archive_resource': {
      await archiveResource(args.slug, args.commit_message);
      return JSON.stringify({ ok: true, slug: args.slug });
    }
    case 'list_open_flags': {
      const reports = await ctx.runQuery(internal.flags.listOpen, {});
      return JSON.stringify({ reports });
    }
    case 'resolve_flag': {
      const result = await ctx.runMutation(internal.flags.resolve, {
        reportId: args.report_id,
        resourceSlug: args.resource_slug,
      });
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export const handleMessage = internalAction({
  args: {
    chatId: v.union(v.string(), v.number()),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: args.text },
    ];

    let reply = "Sorry, something went wrong and I couldn't complete that.";

    try {
      // Bounded loop: the model may chain a few tool calls (e.g. get_resource
      // then create_or_update_resource) before giving a final text reply.
      for (let turn = 0; turn < 6; turn++) {
        const completion = await callOpenAI(messages);
        const choice = completion.choices[0];
        const message = choice.message;
        messages.push(message);

        const toolCalls: ToolCall[] = message.tool_calls || [];
        if (toolCalls.length === 0) {
          reply = message.content || 'Done.';
          break;
        }

        for (const call of toolCalls) {
          let args_: Record<string, any> = {};
          try {
            args_ = JSON.parse(call.function.arguments || '{}');
          } catch {
            // malformed arguments — surface as a tool error, let the model recover
          }
          const result = await runTool(ctx, call.function.name, args_).catch(
            (e) => JSON.stringify({ error: String(e) })
          );
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: result,
          });
        }
      }
    } catch (e) {
      reply = `Error: ${String(e)}`;
    }

    await sendTelegramMessage(args.chatId, reply);
  },
});
