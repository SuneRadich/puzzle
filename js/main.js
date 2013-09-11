/**
 * Component to handle easy switching of spaces
 *
 * @author Sune Radich Vestergaard
 */
(function ($) {

    //Will hold a cache of the fetched json data
    var storage = {};

    //Partial template, to display an area
    var partialTemplate = [
        '<div class="spacesContainer">',
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

    //Template for the basic content in the menu
    var template = [
        '<div>',
            '<span class="tab"></span>',
            '<span class="input">',
                '<span></span>',
                '<input type="text" value="">',
            '</span>',
            '{{> areas}}',
        '</div>'].join('');

    /**
     * Save fetched data locally
     * @param data
     */
    var setCache = function (data) {
        storage.cache = data;
    };

    /**
     * Clear saved cache, can be used in the future when the ui know that the list of spaces have changed
     */
    var invalidateCache = function () {
        delete storage.cache;
    };

    /**
     * Get the saved cache
     * @returns {*}
     */
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

    /**
     * Load the json data, and render the initial menu
     */
    var init = function() {
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
            $('.menu').append(Mustache.render(template, config, {'areas': partialTemplate}));

            //Highlight the first item
            $('.areaContainer a:first').addClass('highlight');


        });

    };

    /**
     *
     * @param searchTerm
     */
    var reBuild = function(searchTerm) {

        var returnObject = {},
            tmpArea = [],
            tmpSpaces = [],
            cache = getCache();

        var data, i, j, searchFor;

        if (searchTerm == undefined) {
            return;
        }

         /**
         * Wrap a substring of a given string with a highlight span tag
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

            //We do not care for case
            searchFor = new RegExp(searchTerm, 'i');

            //Loop through the areas
            for (i = 0; i < data.length; i++) {
                var area = data[i];
                //Loop through each areas spaces
                for (j = 0; j < area.spaces.length; j++) {
                    //Do we have a matching name?
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
            $('.menu > div > div').replaceWith( Mustache.render(partialTemplate, returnObject) );

            //Highlight the first link in the results
            $('.areaContainer a:first').addClass('highlight');

            $(window).trigger('reBuild');
        }
        //Cache did not exist, run init and fetch data
        else {
           init();
        }
    };

    //Initialize the whole thing
    init();


    /** jQuery handlers **/
    var menu = $('.menu');

    /**
     * Custom event, to handle hiding the menu
     */
    menu.on('goHide', function() {
        var self = $(this);
        //Remove the open class from the menu
        self.removeClass('open');
        //Clear the input field
        $('input', self).val("");
    });



    $(window).on('reBuild', function(){

        var spacesContainerOffset = $('.spacesContainer', menu).offset().top;
        var menuHeight = $('.spacesContainer', menu).height() + spacesContainerOffset;
        var viewportHeight = $(window).height();

        if (menuHeight > viewportHeight) {
            $('.spacesContainer', menu).css({
                'max-height': viewportHeight * 0.8 - spacesContainerOffset + "px"
            });
        }
    });

    /**
     * Handle opening and closing of the menu
     */
    menu.on('click', '> a', function (event) {
        //Prevent this click event to bubble up
        event.preventDefault();
        var menu = $(this).parent();

        if (menu.hasClass('open')) {
            menu.trigger('goHide');
        } else {
            menu.addClass('open');

            //Tell the window we build the menu
            $(window).trigger('reBuild');

            //A short delay, while css transition does its thing
            setTimeout(function(){
                //Set focus on the input field
                $('input', menu).focus();
            }, 55);
        }
    });

    //Prevent clicks in the menu to bubble up, enables the body click handler to close the menu
    menu.on('click', function(event){
        event.stopPropagation();
    });

    //Close the menu if the user clicks on anything outside the menu
    $('body').on('click', function(){
        menu.trigger('goHide');
    });

    /**
     * Handle key press in the input. UP and DOWN moves the current highlight, escape closes the menu
     */
    menu.on('keyup', '> div input', function (event) {

        var selectableLinks = '.areaContainer a',
            current = 'a.highlight',
            index = $(selectableLinks).index( $(current) ),
            newIndex = index - 1;

        //Only perform search if the pressed key is not UP, DOWN or ESC
        switch (event.keyCode) {
            case 40:    //down
                newIndex = index + 1;
            case 38:    //up
                $(selectableLinks).removeClass('highlight');
                $(selectableLinks).eq(newIndex).addClass('highlight');
                break;
            case 27:    //esc
                //Reset value in the input field
                $(this).closest('.menu').trigger('goHide');
                //rebuild, to clear any typed in input
                reBuild("");
                break;
            case 13:    //enter
                //Follow the href on the currently highlighted link
                document.location.href = $(current, '.menu').prop('href');
                break;
            default:
                //Filter the list of spaces using the value of the input
                var searchTerm = $(this).val();
                reBuild(searchTerm);
        }
    });


}(jQuery));
