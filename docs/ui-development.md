# UI development

The project uses [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS v4.

Before creating or changing a UI element, first search the configured `shadcn` MCP server for a suitable component or block. Add the matching registry item with `npx shadcn@latest add <component>`. Build a bespoke component only when the registry does not provide a suitable option.

Current UI components live in `src/client/components/ui/`; they are owned by this project and can be adjusted when needed. The configuration is in `components.json`.

## Waiting for API responses

Use the project `Progress` component from `src/client/components/ui/progress.tsx` for long-running user actions. Do not represent an estimated progress value as a server-confirmed percentage when the API does not provide progress events.

For statement analysis, combine the indicator with a timer and plain-language stage text. The status region must use `role="status"` and `aria-live="polite"`; keep the submitted action disabled until the request resolves. The indicator may asymptotically approach completion, but must reach the result state only after a successful response.
