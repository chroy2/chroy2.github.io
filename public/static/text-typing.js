
jQuery.fn.typing_effect = function(keystroke, pause) {
    return this.each(async function() {
        for (let letter of this.getAttribute("data-text")) {
            this.textContent = this.textContent + letter
            await sleep(keystroke)
        }
        while (true) {
            for (let word of this.getAttribute("data-text-array").split(",")) {
                for (let letter of word) {
                    this.textContent = this.textContent + letter
                    await sleep(keystroke)
                }
                await sleep(pause)
                for (let i = word.length + this.getAttribute("data-text").length;
                    i > this.getAttribute("data-text").length; i--) {
                    this.textContent = this.textContent.slice(0, i - 1);
                    await sleep(keystroke)
                }
                await sleep(keystroke)
            }
        }
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

$(".typed-text").typing_effect(100, 800)
