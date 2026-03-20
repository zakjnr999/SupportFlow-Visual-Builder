export function createEditorController({ root, state, render, findNodeById }) {
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

  function attach() {
    root.addEventListener("click", handleRootClick);
    root.addEventListener("input", handleRootInput);
    root.addEventListener("keydown", handleRootKeydown);
  }

  return {
    attach,
  };
}
