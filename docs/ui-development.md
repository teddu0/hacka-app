# UI development

The project uses [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS v4.

Before creating or changing a UI element, first search the configured `shadcn` MCP server for a suitable component or block. Add the matching registry item with `npx shadcn@latest add <component>`. Build a bespoke component only when the registry does not provide a suitable option.

Current UI components live in `src/client/components/ui/`; they are owned by this project and can be adjusted when needed. The configuration is in `components.json`.
