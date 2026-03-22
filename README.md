# SupportFlow Visual Builder

A Vanilla JavaScript decision-tree editor for customer support automation flows.  
This project renders conversation nodes from JSON, connects parent/child branches visually, supports live editing, and includes a runnable preview mode to simulate end-user chat behavior.

## Live Links

- Deployed app: `https://suportflowvisualbuilder.vercel.app/`
- Design system file (Figma/Penpot): `https://www.figma.com/design/hV92RaIJxpoABhOq6KPPio`

## Problem Statement

Support flow configuration in spreadsheets is difficult to validate and hard for non-technical users to reason about.  
This tool provides a visual flow builder and interactive runner so teams can edit and verify conversation logic quickly.

## Tech Stack

- Vanilla JavaScript (ES modules)
- HTML5
- CSS3
- SVG for connector rendering

## Implemented Features

### 1) Visual Graph

- Nodes render from `flow_data.json`.
- Nodes are positioned absolutely using provided `x/y` coordinates.
- Parent/child relationships are rendered as custom SVG paths (no graph library).

### 2) Node Editor

- Clicking a node selects it.
- Inspector panel shows node metadata and branch information.
- Question text is editable in the inspector and updates on canvas immediately (in-memory state).

### 3) Preview Mode (Runner)

- Top-bar `Play Preview` button toggles editor -> preview.
- Preview starts from the `start` node.
- Selecting an option traverses to the next node and appends to a transcript.
- Leaf nodes show a `Restart` action.

### 4) Wildcard Feature: Draggable Nodes With Grid Snapping

- Nodes can be dragged in editor mode to reorganize layout.
- Movement snaps to a 20px grid for cleaner diagrams.
- Node positions remain in local runtime state and connectors recalculate after drop.

### Why This Wildcard Adds Business Value

- Reduces time spent manually tuning layout coordinates.
- Improves readability for managers reviewing complex flows.
- Makes handoff conversations faster by allowing visual cleanup directly in the tool.

## Architecture

`src/main.js`

- App bootstrap, state initialization, module wiring, data loading.

`src/render.js`

- UI rendering for editor and preview mode.

`src/connectors.js`

- SVG path generation and connector layout scheduling.

`src/editor.js`

- Node selection, inline text editing, node drag handling.

`src/preview.js`

- Preview mode state transitions and conversation traversal.

`src/utils.js`

- Shared helper functions (escaping, stats, labels).

## Local Setup

1. Clone repository and move into project:

```bash
git clone https://github.com/zakjnr999/SupportFlow-Visual-Builder.git
cd SupportFlow-Visual-Builder
```

2. Serve with a local HTTP server (required for JSON fetch):

```bash
python3 -m http.server 5500
```

3. Open:

```text
http://127.0.0.1:5500
```

## Usage

- Editor mode:
  - Click nodes to inspect and edit text.
  - Drag nodes to reposition and improve layout.
- Preview mode:
  - Click `Play Preview`.
  - Select response options to traverse the flow.
  - Use `Restart` at end nodes.

## Constraints Compliance

- No flowchart/graph libraries (e.g. `react-flow`, `jsPlumb`, `mermaid.js`).
- No UI component libraries (Bootstrap/Material UI/Chakra UI).
- State is managed in-memory; no external database.

## Data Source

- `flow_data.json`

## License

This repository includes a `LICENSE` file from the original challenge source.
