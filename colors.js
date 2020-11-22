// https://stackoverflow.com/questions/1484506/random-color-generator
// https://css-tricks.com/snippets/javascript/random-hex-color/


COLORS_CACHE = new Object();
BRIGHT_COLORS_CACHE = new Object();


function randomColor(text) 
{
    if (COLORS_CACHE[text] == null)
        COLORS_CACHE[text] = randomColorNew(text);
        
    return COLORS_CACHE[text];
}


function randomColorWithWhite()
{
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}


function randomColorBright(text)
{
    if (BRIGHT_COLORS_CACHE[text] == null)
        BRIGHT_COLORS_CACHE[text] = 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 1)';

    return BRIGHT_COLORS_CACHE[text];
}


function randomColorNew(text) 
{
    var hash = 0;
    for (var i = 0; i < text.length; i++)
        hash = text.charCodeAt(i) + ((hash << 5) - hash);

    var color = '#';
    for (var i = 0; i < 3; i++) 
    {
        var value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
}


function hashCode(text) 
{
    let hash = 0;
    for (var i = 0; i < text.length; i++)
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    return hash;
}


function pickColor(text) 
{
    return `hsl(${hashCode(text) % 360}, 100%, 80%)`;
}