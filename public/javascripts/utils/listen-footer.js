function listenFooter(target, emitFunction, options) {
    const support = !((window.MutationObserver || true) === true);
    let listenFooterHeight = { error: "您的浏览器不支持 MutationObserver" };
    if (support) {
        options = options || {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        };
        listenFooterHeight = new MutationObserver(emitFunction);
        listenFooterHeight.observe(target, options);
    }
    window.addEventListener("resize", emitFunction);
    return listenFooterHeight;
}
