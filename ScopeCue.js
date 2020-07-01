// Thanks Bro! Code from https://github.com/eboody/Roam-Scripts/blob/master/ScopeCue.js
// slightly modified 

//global vars
var oldColor
var backgroundColor
var oldBulletColor
var initialized = 0
var mycolor = '#2E86C1'

function addListenerToBlocks(){
    //highlight elements on mouse up
    Array.prototype.map.call(document.querySelectorAll(".flex-v-box.roam-block-container.block-bullet-view"), e => e.onmouseup = function(e){
        highlight();
        setTimeout(highlight, 50)
    })
}
//highlight the text area bullet, the left border of children of the sibling and the bullet of the sibling
function highlight (){
    try 
      {
        //make a reference to textarea's container
        var textAreaContainer = document.querySelector("textarea").parentNode.parentNode.parentNode.parentNode

        //make the bullet of the textarea orange
        textAreaContainer.querySelector(".simple-bullet-outer").style.backgroundColor = mycolor

        //check to see if this block is a header
        var isHeader = document.querySelector("textarea").parentNode.parentNode.className.includes("level")
        //create reference
        var siblingIsParent
        if (isHeader == false){
            //check if the sibling above is a parent, because if it's not there's no point in highlighting the bullet
            siblingIsParent = textAreaContainer.previousElementSibling.children[1].children.length
        }
        else {
            //header version
            //check if the sibling above is a parent, because if it's not there's no point in highlighting the bullet
            siblingIsParent = textAreaContainer.parentNode.previousElementSibling.children[1].children.length
        }

        if (siblingIsParent > 0){
            //if the textarea isn't a header do this
            if (isHeader == false){

                //make the left border of the children of the (sibling above textarea) orange
                Array.prototype.map.call(textAreaContainer.previousElementSibling.children[1].childNodes, e => e.style.borderColor = mycolor)

                //make bullet for (sibling above textarea) orange for regular blocks
                textAreaContainer.previousElementSibling.firstElementChild.querySelector(".simple-bullet-outer").style.backgroundColor = mycolor
            }
            //if it's a header do this
            else {
                //make the borders of the children of the text area's sibling orange, if the text area is a header
                Array.prototype.map.call(textAreaContainer.parentNode.previousElementSibling.children[1].childNodes, e => e.style.borderColor = mycolor)
                textAreaContainer.parentNode.previousElementSibling.firstElementChild.querySelector(".simple-bullet-outer").style.backgroundColor = mycolor
            }
        }      
      } catch(err) {}
  
  }
function normalize(){
   try { 
   //make all borders normal color
    Array.prototype.map.call(document.querySelectorAll(".block-border-left"), e => e.style.borderColor = oldColor)
    //make all outer bullets normal color
    Array.prototype.map.call(document.querySelectorAll(".simple-bullet-outer"), e => e.style.backgroundColor = backgroundColor);
    //make all inner bullets normal
      document.querySelector("textarea").parentElement.parentElement.querySelector(".simple-bullet-inner").style.backgroundColor = oldBulletColor
    } catch(err) {}
}


function initialize(){
    //get the initial colors of inner, outer bullets and borders
    if (document.querySelector('.block-border-left')){
    oldColor = window.getComputedStyle(document.querySelector('.block-border-left')).borderColor}
    backgroundColor = window.getComputedStyle(document.querySelector(".simple-bullet-outer")).backgroundColor
    oldBulletColor = window.getComputedStyle(document.querySelector(".simple-bullet-inner")).backgroundColor

    //if I press any of these keys, normalize the colors of the elements. You can see the list of keys and their codes here: https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
    document.querySelector(".roam-article").onkeydown = function(e) {
        if( e.which == 8 || e.which == 9 || (e.shiftKey && e.which == 9) || e.which == 13 || e.which == 38 || e.which == 40 || (e.altKey && e.shiftKey && e.which == 37)|| (e.altKey && e.shiftKey && e.which == 38)|| (e.altKey && e.shiftKey && e.which == 39)|| (e.altKey && e.shiftKey && e.which == 40) || (e.which == 27)){
            normalize();
            setTimeout(normalize, 50)
        }
    };
    //if I press any of these keys highlight the colors of the elements mentioned above
    document.querySelector(".roam-article").onkeyup = function(e) {
        if ( e.which == 8 || e.which == 9 || (e.shiftKey && e.which == 9) || e.which == 13 || e.which == 38 || e.which == 40 || (e.altKey && e.shiftKey && e.which == 37)|| (e.altKey && e.shiftKey && e.which == 38)|| (e.altKey && e.shiftKey && e.which == 39)|| (e.altKey && e.shiftKey && e.which == 40) ){
            highlight();
            setTimeout(highlight, 50)
        }
    };
    //refresh the listeners on mouseup
    document.onmouseup = function(){
        highlight();
        setTimeout(highlight, 50)
        addListenerToBlocks();
    }

    //normalize and refresh listeners on mousedown
    document.onmousedown = function(){
        addListenerToBlocks();
        normalize();
        setTimeout(normalize, 50)
    }
}
//don't initialize until the h1 element exists
var checkExist = setInterval(function() {
   if (document.querySelector('h1')) {
      initialize();
      clearInterval(checkExist);
   }
}, 100); // check every 100ms

setTimeout(5000, initialize);