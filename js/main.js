$('.menu a').on('click', function (event) {
    //Prevent this click event to bubble up
    event.stopPropagation();
    event.preventDefault();
    $(this).parent().toggleClass('open');

});

//TODO fix hiding on body click
$('QQbody').on('click', function() {
    //If the menu is open, hide it
    var shouldHide = $('header li.menu').hasClass('open');
    if (shouldHide) {
        $('header li.menu.open').removeClass('open');
    }
});


$('.menu').on('keyup', '> div input', function(){
   var searchTerm = $(this).val();
    reBuild(searchTerm);
});
//Dummy, to prevent following # links
$('header ul li').on('click', function (event) {
    event.preventDefault();
});

//TODO cache json
//TODO Escape ' and handle javascript

(function ($) {

    //Partial template, to display an area
    var template_area = [
        '<div>',
        '<ol>',
        '{{#areas}}',
        '<li>','<div>',
            '<img src="{{image.thumbnail_link}}" alt="{{hosted_by_humanized_name}}">',
        '</div>',
        '<div>',
            '<a href="{{url}}">{{{name}}}</a>',
            '<ol>',
                '{{#spaces}}',
                '<li><a href="{{url}}">{{{name}}}</a></li>',
                '{{/spaces}}',
            '</ol>',
        '</div>',
        '</li>',
        '{{/areas}}',
        '</ol>',
        '</div>'
    ].join('');

    //Compile partial template for faster reference and usage in the main template
    Mustache.compilePartial('template_area', template_area);

    var template = [
        '<div>',
            '<span class="tab"></span>',
            '<input type="text">',
            '{{> template_area}}',
        '</div>'].join('');

    //Get the data, and build the nessesary html for the dropdown
    $.getJSON('data/data.json', function (data) {

        //Mustache config object
        var config = {};
        //tmp array, needed to save areas with a key
        var tmp = [];

        //Loop through all areas, and add them to the array
        $(data).each(function (index, item) {
            tmp.push(item);
        });
        //Add the areas array to the configuration object
        config.areas = tmp;

        //Render the template, and append to the DOM
        $('.menu').append( Mustache.render(template, config) );

    });

    function reBuild(searchTerm) {

        var returnObject = {};
        var tmpArea = [];
        var tmpSpaces = [];

        if (searchTerm == undefined) {
            return;
        }

        /**
         * Add a span to a given substring in a given string
         * @param part {string} The string to wrap in a span
         * @param str {string} The string to manipulate
         *
         * @returns {string}
         */
        function highlight(part, str) {

            var regexp = new RegExp('(' + part + ')', 'gi');

            return str.replace(regexp, '<span class="highlight">$1</span>');

        }

        //Manipulate the json data, and filter spaces and areas so only the ones that match are left
        $.getJSON('data/data.json', function(data){

            var i, j;
            var searchFor = new RegExp(searchTerm, 'i');

            for (i = 0; i < data.length;i++){

                var area = data[i];

                for (j = 0; j < area.spaces.length; j++) {

                    if (area.spaces[j].name.match(searchFor)) {

                        //Highlight the matching part(s) of the name
                        area.spaces[j].name = highlight(searchTerm, area.spaces[j].name);

                        //Save current space in a temp array
                        tmpSpaces.push(area.spaces[j]);
                    }
                }

                //We had spaces that matched the query
                if (tmpSpaces.length > 0) {
                    //Replace the spaces from the data with only the matching ones
                    area.spaces = tmpSpaces;
                    //Add the area to the temp array
                    tmpArea.push(area);
                    //Reset tmpSpaces for the next iteration
                    tmpSpaces = [];
                }
                //No spaces matched, but maybe the area name does?
                else if (area.name.match(searchFor)) {
                    //Highlight the matching part(s) of the name
                    area.name = highlight(searchTerm, area.name);
                    area.spaces = [];
                    tmpArea.push(area);
                }
            }

            //Add the resulting areas to the return object
            returnObject.areas = tmpArea;

            //Render the results, and add them to the DOM
            $('.menu > div > div').replaceWith( Mustache.render(template_area, returnObject) );

        });
    }

    window.reBuild = reBuild;

}(jQuery));
