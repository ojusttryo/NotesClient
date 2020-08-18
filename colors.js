// https://stackoverflow.com/questions/1484506/random-color-generator
// https://css-tricks.com/snippets/javascript/random-hex-color/


COLORS_CACHE = new Object();
BRIGHT_COLORS_CACHE = new Object();


function randomColor(text) 
{
    if (COLORS_CACHE[text] == null)
        COLORS_CACHE[text] = '#' + Math.floor(Math.random()*16777215).toString(16);
        
    return COLORS_CACHE[text];
}


function randomColorBright(text)
{
    if (BRIGHT_COLORS_CACHE[text] == null)
        BRIGHT_COLORS_CACHE[text] = 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 1)';

    return BRIGHT_COLORS_CACHE[text];
}