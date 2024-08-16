$(document).on("click", "#color-mode-btn", function() {
    const modes = ["dark", "light"]
    var attribute = $("html").attr("data-bs-theme")
    var index = ((modes.indexOf(attribute) === modes.length - 1) ? 0 : modes.indexOf(attribute) + 1);
    $("html").attr("data-bs-theme", modes[index])
})

$(document).ready(function() {
    let darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkThemeMq == true) {
        $("html").attr("data-bs-theme", "dark")
    } else {
        $("html").attr("data-bs-theme", "light")
    }
});

let darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)")
darkThemeMq.addListener(e => {
    if (e.matches) {
        $("html").attr("data-bs-theme", "dark")
    } else {
        $("html").attr("data-bs-theme", "light")
    }
});

