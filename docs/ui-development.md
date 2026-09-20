# UI development

The project uses [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS v4.

## Visual theme

The interface supports light and dark themes. The selected theme is saved in browser `localStorage` under `pocket-accountant:theme`; when it is absent, the system preference is used. Theme tokens live in `src/client/styles.css`: light mode uses pale graphite tones, while dark mode uses neutral graphite and slate surfaces with subtle cool gradients; both use an amber action accent. Surface-level `data-slot` components (cards, alerts, tables, and progress blocks) use a semi-transparent, blurred glass surface with bright edge highlights and background blur; preserve this treatment when adding new dashboard surfaces.

The expense donut chart shows the total in its center. Hovering a sector lifts it, displays its category and amount in the center, and dims the other legend entries.

## Transaction list

The operations table has a category filter, client-side pagination of 25 rows, and sortable date, category, and amount columns. Keep filtering, sorting, and pagination client-side: the API response remains the source of truth. Apply filtering and sorting before pagination. The default order is date descending; clicking an active column reverses its direction. Reset to page one when the filter or sort changes. When more than one page exists, show the visible row range, current page, and disabled states for the first and last page controls; mark the navigation with an accessible label and announce its current-page text politely. Show the active direction with an icon, use `aria-sort` on sortable headers, and retain the result count, a reset action, and an empty state for a selected category with no matching transactions.

The category control is a native `select`. Set explicit foreground and background colors for its `option` elements: Chrome on Windows otherwise may open a white menu while inheriting the light foreground color from the dark theme.

Before creating or changing a UI element, first search the configured `shadcn` MCP server for a suitable component or block. Add the matching registry item with `npx shadcn@latest add <component>`. Build a bespoke component only when the registry does not provide a suitable option.

Current UI components live in `src/client/components/ui/`; they are owned by this project and can be adjusted when needed. The configuration is in `components.json`.

## Waiting for API responses

Use the project `Progress` component from `src/client/components/ui/progress.tsx` for long-running user actions. Do not represent an estimated progress value as a server-confirmed percentage when the API does not provide progress events.

For statement analysis, combine the indicator with a timer and plain-language stage text. The status region must use `role="status"` and `aria-live="polite"`; keep the submitted action disabled until the request resolves. The indicator may asymptotically approach completion, but must reach the result state only after a successful response.
