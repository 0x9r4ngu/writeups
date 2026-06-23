document.addEventListener('DOMContentLoaded', function(){
    // Loading page
    window.addEventListener("load", () => {
        var load_div = document.querySelector('#loading');

        if(load_div != null){
            setTimeout(function(){
                load_div.style.transition = '.75s';
                load_div.style.opacity = '0';
                load_div.style.visibility = 'hidden';
            }, 800);
        }
    });

    // Continuous feed — pagination disabled: every post stays rendered, no page
    // slicing or prev/next controls. All <li> items remain visible for one
    // continuous scroll.
});
