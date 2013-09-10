$('.menu').on('click', function(){
   $(this).toggleClass('open');
});

$('header ul li').on('click', function(event) {
   event.preventDefault();
});
