(function ($) {

    var storage = {
        currentIndex: 0
    };

    //Partial template, to display an area
    var template_area = [
        '<div>',
        '<ol>',
        '{{#areas}}',
        '<li>',
        '<div>',
        '<img src="{{image.thumbnail_link}}" alt="{{hosted_by_humanized_name}}">',
        '</div>',
        '<div class="areaContainer">',
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
        '<span class="input"><span></span><input type="text"></span>',
        '{{> template_area}}',
        '</div>'].join('');

    /**
     * Save fetched data locally
     * @param data
     */
    var setCache = function (data) {
        storage.cache = data;
    };

    /**
     * Clear saved cache
     */
    var invalidateCache = function () {
        delete storage.cache;
    };

    var getCache = function () {
        if ("cache" in storage) {
            return storage.cache;
        } else {
            return false;
        }
    };

    var loadJSON = function (callback) {

        //Get the data, and build the nessesary html for the dropdown
        $.getJSON('data/data.json', function (data) {

            setCache(data);

            if (typeof callback === "function") {
                callback();
            }
        });
    };


    loadJSON(function () {

        //Mustache config object
        var config = {};
        //tmp array, needed to save areas with a key
        var tmp = [];
        var data = getCache();

        //Loop through all areas, and add them to the array
        $(data).each(function (index, item) {
            tmp.push(item);
        });

        //Add the areas array to the configuration object
        config.areas = tmp;

        //Render the template, and append to the DOM
        $('.menu').append(Mustache.render(template, config));
        //Highlight the first item
        $('.areaContainer a:first').addClass('highlight');
    });

    function reBuild(searchTerm) {

        var returnObject = {};
        var tmpArea = [];
        var tmpSpaces = [];
        var cache = getCache();
        var data, i, j, searchFor;

        if (searchTerm == undefined) {
            return;
        }

         /**
         * Add a span to a given substring in a given string
         *
         * @param part {string} The string to wrap in a span
         * @param str {string} The string to manipulate
         *
         * @returns {string}
         */
        function highlight(part, str) {
            var regexp = new RegExp('(' + part + ')', 'gi');
            return str.replace(regexp, '<span class="highlight">$1</span>');
        }

        //Cache exists
        if (cache !== false) {

            //Deep copy, to keep cache untouched
            data = $().extend(true, [], cache);

            searchFor = new RegExp(searchTerm, 'i');

            for (i = 0; i < data.length; i++) {

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
                    //Reset the spaces attribute, to make sure only the area name is shown
                    area.spaces = [];
                    tmpArea.push(area);
                }
            }

            //Add the resulting areas to the return object
            returnObject.areas = tmpArea;

            //Render the results, and add them to the DOM
            $('.menu > div > div').replaceWith( Mustache.render(template_area, returnObject) );

            //Highlight the first link in the results
            $('.areaContainer a:first').addClass('highlight');
        }
        else {
            //reload json, and rebuild
        }
    }

    window.reBuild = reBuild;

    /** jQuery **/

    /**
     * Handle opening and closing of the submenu
     */
    $('.menu a').on('click', function (event) {
        //Prevent this click event to bubble up
        event.stopPropagation();
        event.preventDefault();
        $(this).parent().toggleClass('open');
    });

//TODO fix hiding on body click

    /**
     * Handle keypress in the input. UP and DOWN moves the current highlight, escape closes the submenu
     */
    $('.menu').on('keyup', '> div input', function (event) {

        var selectableLinks = '.areaContainer a';
        var current = 'a.highlight';
        var index = $(selectableLinks).index($(current));
        var newIndex = index - 1;

        //Only submit search if it is not UP or DOWN or ESC
        switch (event.keyCode) {
            case 40:    //down
                newIndex = index + 1;
            case 38:    //up
                $('.areacontainer a', '.menu').removeClass('highlight');
                $(selectableLinks).removeClass('highlight');
                $(selectableLinks).eq(newIndex).addClass('highlight');
                break;
            case 27:    //esc
                //Reset value in the input field
                $(this).val("");
                //Hide the menu
                $(this).closest('.menu').removeClass('open');
                //rebuild, to clear any typed in input
                reBuild("");
                break;
            case 13:    //enter
                //Follow the href on the currently highlighted link
                document.location.href = $(current, '.menu').prop('href');
                break;
            default:
                var searchTerm = $(this).val();
                reBuild(searchTerm);
        }
    });
}(jQuery));
