export function createEditorController({ root, state, render, findNodeById }) {
  // Keep node placement tidy and predictable while dragging.
  const GRID_SIZE = 20;
  let dragState = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function snapToGrid(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  function beginDrag(event, nodeElement) {
    const nodeId = nodeElement.dataset.nodeId;
    const node = findNodeById(nodeId);

    if (!node || !state.flow) {
      return;
    }

    if (state.selectedNodeId !== nodeId) {
      // Selection follows drag start so inspector always matches active node.
      state.selectedNodeId = nodeId;
      render();
    }

    dragState = {
      nodeId,
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      originX: node.position.x,
      originY: node.position.y,
      nodeWidth: nodeElement.offsetWidth || 230,
      nodeHeight: nodeElement.offsetHeight || 180,
      moved: false,
    };

    document.body.classList.add("is-dragging-node");
    const activeNode = root.querySelector(`.flow-node[data-node-id="${nodeId}"]`);
    activeNode?.classList.add("flow-node--dragging");
  }

  function handleDragMove(event) {
    if (!dragState || state.mode !== "editor" || !state.flow) {
      return;
    }

    const node = findNodeById(dragState.nodeId);

    if (!node) {
      return;
    }

    const dx = event.clientX - dragState.pointerStartX;
    const dy = event.clientY - dragState.pointerStartY;
    const maxX = Math.max(
      0,
      state.flow.meta.canvas_size.w - dragState.nodeWidth,
    );
    const maxY = Math.max(
      0,
      state.flow.meta.canvas_size.h - dragState.nodeHeight,
    );
    const nextX = clamp(snapToGrid(dragState.originX + dx), 0, maxX);
    const nextY = clamp(snapToGrid(dragState.originY + dy), 0, maxY);

    if (nextX === node.position.x && nextY === node.position.y) {
      return;
    }

    node.position.x = nextX;
    node.position.y = nextY;
    dragState.moved = true;

    const activeNode = root.querySelector(
      `.flow-node[data-node-id="${dragState.nodeId}"]`,
    );

    if (!activeNode) {
      return;
    }

    // Update position live without full rerender for smoother drag interaction.
    activeNode.style.left = `${nextX}px`;
    activeNode.style.top = `${nextY}px`;
    activeNode.classList.add("flow-node--dragging");
  }

  function endDrag() {
    if (!dragState) {
      return;
    }

    const moved = dragState.moved;
    dragState = null;
    document.body.classList.remove("is-dragging-node");

    if (moved) {
      render();
    }
  }

  function restoreEditorSelection(nodeId, cursorState) {
    if (!cursorState) {
      return;
    }

    requestAnimationFrame(() => {
      const textField = root.querySelector(
        `[name="node-text"][data-node-id="${nodeId}"]`,
      );

      if (!textField) {
        return;
      }

      textField.focus();
      textField.setSelectionRange(
        cursorState.selectionStart,
        cursorState.selectionEnd,
      );
      textField.scrollTop = cursorState.scrollTop;
    });
  }

  function selectNode(nodeId) {
    if (!state.flow || state.selectedNodeId === nodeId) {
      return;
    }

    state.selectedNodeId = nodeId;
    render();
  }

  function updateNodeText(nodeId, nextText, cursorState) {
    const node = findNodeById(nodeId);

    if (!node || node.text === nextText) {
      return;
    }

    node.text = nextText;
    render();
    restoreEditorSelection(nodeId, cursorState);
  }

  function handleRootClick(event) {
    // Ignore click-up after a drag so we do not re-trigger selection logic.
    if (dragState?.moved) {
      return;
    }

    const nodeElement = event.target.closest(".flow-node");

    if (!nodeElement || !root.contains(nodeElement)) {
      return;
    }

    selectNode(nodeElement.dataset.nodeId);
  }

  function handleRootInput(event) {
    const textField = event.target.closest('[name="node-text"]');

    if (!textField || !root.contains(textField)) {
      return;
    }

    updateNodeText(textField.dataset.nodeId, textField.value, {
      selectionStart: textField.selectionStart,
      selectionEnd: textField.selectionEnd,
      scrollTop: textField.scrollTop,
    });
  }

  function handleRootKeydown(event) {
    const nodeElement = event.target.closest(".flow-node");

    if (!nodeElement || !root.contains(nodeElement)) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    selectNode(nodeElement.dataset.nodeId);
  }

  function handleRootPointerDown(event) {
    if (state.mode !== "editor" || event.button !== 0) {
      return;
    }

    const nodeElement = event.target.closest(".flow-node");

    if (!nodeElement || !root.contains(nodeElement)) {
      return;
    }

    event.preventDefault();
    beginDrag(event, nodeElement);
  }

  function handleWindowPointerMove(event) {
    handleDragMove(event);
  }

  function handleWindowPointerUp() {
    endDrag();
  }

  function attach() {
    root.addEventListener("click", handleRootClick);
    root.addEventListener("input", handleRootInput);
    root.addEventListener("keydown", handleRootKeydown);
    root.addEventListener("pointerdown", handleRootPointerDown);
    // Track pointer globally so drag keeps working outside the canvas bounds.
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
  }

  return {
    attach,
  };
}
