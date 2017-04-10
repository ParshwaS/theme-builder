/*! X-editable - v1.5.1 
* In-place editing with Twitter Bootstrap, jQuery UI or pure jQuery
* http://github.com/vitalets/x-editable
* Copyright (c) 2013 Vitaliy Potapov; Licensed MIT */
/**
Form with single input element, two buttons and two states: normal/loading.
Applied as jQuery method to DIV tag (not to form tag!). This is because form can be in loading state when spinner shown.
Editableform is linked with one of input types, e.g. 'text', 'select' etc.

@class editableform
@uses text
@uses textarea
**/
(function ($) {
    "use strict";
    
    var EditableForm = function (div, options) {
        this.options = $.extend({}, $.fn.editableform.defaults, options);
        this.$div = $(div); //div, containing form. Not form tag. Not editable-element.
        if(!this.options.scope) {
            this.options.scope = this;
        }
        //nothing shown after init
    };

    EditableForm.prototype = {
        constructor: EditableForm,
        initInput: function() {  //called once
            //take input from options (as it is created in editable-element)
            this.input = this.options.input;
            
            //set initial value
            //todo: may be add check: typeof str === 'string' ? 
            this.value = this.input.str2value(this.options.value); 
            
            //prerender: get input.$input
            this.input.prerender();
        },
        initTemplate: function() {
            this.$form = $($.fn.editableform.template); 
        },
        initButtons: function() {
            var $btn = this.$form.find('.editable-buttons');
            $btn.append($.fn.editableform.buttons);
            if(this.options.showbuttons === 'bottom') {
                $btn.addClass('editable-buttons-bottom');
            }
        },
        /**
        Renders editableform

        @method render
        **/        
        render: function() {
            //init loader
            this.$loading = $($.fn.editableform.loading);        
            this.$div.empty().append(this.$loading);
            
            //init form template and buttons
            this.initTemplate();
            if(this.options.showbuttons) {
                this.initButtons();
            } else {
                this.$form.find('.editable-buttons').remove();
            }

            //show loading state
            this.showLoading();            
            
            //flag showing is form now saving value to server. 
            //It is needed to wait when closing form.
            this.isSaving = false;
            
            /**        
            Fired when rendering starts
            @event rendering 
            @param {Object} event event object
            **/            
            this.$div.triggerHandler('rendering');
            
            //init input
            this.initInput();
            
            //append input to form
            this.$form.find('div.editable-input').append(this.input.$tpl);            
            
            //append form to container
            this.$div.append(this.$form);
            
            //render input
            $.when(this.input.render())
            .then($.proxy(function () {
                //setup input to submit automatically when no buttons shown
                if(!this.options.showbuttons) {
                    this.input.autosubmit(); 
                }
                 
                //attach 'cancel' handler
                this.$form.find('.editable-cancel').click($.proxy(this.cancel, this));
                
                if(this.input.error) {
                    this.error(this.input.error);
                    this.$form.find('.editable-submit').attr('disabled', true);
                    this.input.$input.attr('disabled', true);
                    //prevent form from submitting
                    this.$form.submit(function(e){ e.preventDefault(); });
                } else {
                    this.error(false);
                    this.input.$input.removeAttr('disabled');
                    this.$form.find('.editable-submit').removeAttr('disabled');
                    var value = (this.value === null || this.value === undefined || this.value === '') ? this.options.defaultValue : this.value;
                    this.input.value2input(value);
                    //attach submit handler
                    this.$form.submit($.proxy(this.submit, this));
                }

                /**        
                Fired when form is rendered
                @event rendered
                @param {Object} event event object
                **/            
                this.$div.triggerHandler('rendered');                

                this.showForm();
                
                //call postrender method to perform actions required visibility of form
                if(this.input.postrender) {
                    this.input.postrender();
                }                
            }, this));
        },
        cancel: function() {   
            /**        
            Fired when form was cancelled by user
            @event cancel 
            @param {Object} event event object
            **/              
            this.$div.triggerHandler('cancel');
        },
        showLoading: function() {
            var w, h;
            if(this.$form) {
                //set loading size equal to form
                w = this.$form.outerWidth();
                h = this.$form.outerHeight(); 
                if(w) {
                    this.$loading.width(w);
                }
                if(h) {
                    this.$loading.height(h);
                }
                this.$form.hide();
            } else {
                //stretch loading to fill container width
                w = this.$loading.parent().width();
                if(w) {
                    this.$loading.width(w);
                }
            }
            this.$loading.show(); 
        },

        showForm: function(activate) {
            this.$loading.hide();
            this.$form.show();
            if(activate !== false) {
                this.input.activate(); 
            }
            /**        
            Fired when form is shown
            @event show 
            @param {Object} event event object
            **/                    
            this.$div.triggerHandler('show');
        },

        error: function(msg) {
            var $group = this.$form.find('.control-group'),
                $block = this.$form.find('.editable-error-block'),
                lines;

            if(msg === false) {
                $group.removeClass($.fn.editableform.errorGroupClass);
                $block.removeClass($.fn.editableform.errorBlockClass).empty().hide(); 
            } else {
                //convert newline to <br> for more pretty error display
                if(msg) {
                    lines = (''+msg).split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        lines[i] = $('<div>').text(lines[i]).html();
                    }
                    msg = lines.join('<br>');
                }
                $group.addClass($.fn.editableform.errorGroupClass);
                $block.addClass($.fn.editableform.errorBlockClass).html(msg).show();
            }
        },

        submit: function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            //get new value from input
            var newValue = this.input.input2value(); 

            //validation: if validate returns string or truthy value - means error
            //if returns object like {newValue: '...'} => submitted value is reassigned to it
            var error = this.validate(newValue);
            if ($.type(error) === 'object' && error.newValue !== undefined) {
                newValue = error.newValue;
                this.input.value2input(newValue);
                if(typeof error.msg === 'string') {
                    this.error(error.msg);
                    this.showForm();
                    return;
                }
            } else if (error) {
                this.error(error);
                this.showForm();
                return;
            } 
            
            //if value not changed --> trigger 'nochange' event and return
            /*jslint eqeq: true*/
            if (!this.options.savenochange && this.input.value2str(newValue) == this.input.value2str(this.value)) {
            /*jslint eqeq: false*/                
                /**        
                Fired when value not changed but form is submitted. Requires savenochange = false.
                @event nochange 
                @param {Object} event event object
                **/                    
                this.$div.triggerHandler('nochange');            
                return;
            } 

            //convert value for submitting to server
            var submitValue = this.input.value2submit(newValue);
            
            this.isSaving = true;
            
            //sending data to server
            $.when(this.save(submitValue))
            .done($.proxy(function(response) {
                this.isSaving = false;

                //run success callback
                var res = typeof this.options.success === 'function' ? this.options.success.call(this.options.scope, response, newValue) : null;

                //if success callback returns false --> keep form open and do not activate input
                if(res === false) {
                    this.error(false);
                    this.showForm(false);
                    return;
                }

                //if success callback returns string -->  keep form open, show error and activate input               
                if(typeof res === 'string') {
                    this.error(res);
                    this.showForm();
                    return;
                }

                //if success callback returns object like {newValue: <something>} --> use that value instead of submitted
                //it is usefull if you want to chnage value in url-function
                if(res && typeof res === 'object' && res.hasOwnProperty('newValue')) {
                    newValue = res.newValue;
                }

                //clear error message
                this.error(false);   
                this.value = newValue;
                /**        
                Fired when form is submitted
                @event save 
                @param {Object} event event object
                @param {Object} params additional params
                @param {mixed} params.newValue raw new value
                @param {mixed} params.submitValue submitted value as string
                @param {Object} params.response ajax response

                @example
                $('#form-div').on('save'), function(e, params){
                    if(params.newValue === 'username') {...}
                });
                **/
                this.$div.triggerHandler('save', {newValue: newValue, submitValue: submitValue, response: response});
            }, this))
            .fail($.proxy(function(xhr) {
                this.isSaving = false;

                var msg;
                if(typeof this.options.error === 'function') {
                    msg = this.options.error.call(this.options.scope, xhr, newValue);
                } else {
                    msg = typeof xhr === 'string' ? xhr : xhr.responseText || xhr.statusText || 'Unknown error!';
                }

                this.error(msg);
                this.showForm();
            }, this));
        },

        save: function(submitValue) {
            //try parse composite pk defined as json string in data-pk 
            this.options.pk = $.fn.editableutils.tryParseJson(this.options.pk, true); 
            
            var pk = (typeof this.options.pk === 'function') ? this.options.pk.call(this.options.scope) : this.options.pk,
            /*
              send on server in following cases:
              1. url is function
              2. url is string AND (pk defined OR send option = always) 
            */
            send = !!(typeof this.options.url === 'function' || (this.options.url && ((this.options.send === 'always') || (this.options.send === 'auto' && pk !== null && pk !== undefined)))),
            params;

            if (send) { //send to server
                this.showLoading();

                //standard params
                params = {
                    name: this.options.name || '',
                    value: submitValue,
                    pk: pk 
                };

                //additional params
                if(typeof this.options.params === 'function') {
                    params = this.options.params.call(this.options.scope, params);  
                } else {
                    //try parse json in single quotes (from data-params attribute)
                    this.options.params = $.fn.editableutils.tryParseJson(this.options.params, true);   
                    $.extend(params, this.options.params);
                }

                if(typeof this.options.url === 'function') { //user's function
                    return this.options.url.call(this.options.scope, params);
                } else {  
                    //send ajax to server and return deferred object
                    return $.ajax($.extend({
                        url     : this.options.url,
                        data    : params,
                        type    : 'POST'
                    }, this.options.ajaxOptions));
                }
            }
        }, 

        validate: function (value) {
            if (value === undefined) {
                value = this.value;
            }
            if (typeof this.options.validate === 'function') {
                return this.options.validate.call(this.options.scope, value);
            }
        },

        option: function(key, value) {
            if(key in this.options) {
                this.options[key] = value;
            }
            
            if(key === 'value') {
                this.setValue(value);
            }
            
            //do not pass option to input as it is passed in editable-element
        },

        setValue: function(value, convertStr) {
            if(convertStr) {
                this.value = this.input.str2value(value);
            } else {
                this.value = value;
            }
            
            //if form is visible, update input
            if(this.$form && this.$form.is(':visible')) {
                this.input.value2input(this.value);
            }            
        }               
    };

    /*
    Initialize editableform. Applied to jQuery object.

    @method $().editableform(options)
    @params {Object} options
    @example
    var $form = $('&lt;div&gt;').editableform({
        type: 'text',
        name: 'username',
        url: '/post',
        value: 'vitaliy'
    });

    //to display form you should call 'render' method
    $form.editableform('render');     
    */
    $.fn.editableform = function (option) {
        var args = arguments;
        return this.each(function () {
            var $this = $(this), 
            data = $this.data('editableform'), 
            options = typeof option === 'object' && option; 
            if (!data) {
                $this.data('editableform', (data = new EditableForm(this, options)));
            }

            if (typeof option === 'string') { //call method 
                data[option].apply(data, Array.prototype.slice.call(args, 1));
            } 
        });
    };

    //keep link to constructor to allow inheritance
    $.fn.editableform.Constructor = EditableForm;    

    //defaults
    $.fn.editableform.defaults = {
        /* see also defaults for input */

        /**
        Type of input. Can be <code>text|textarea|select|date|checklist</code>

        @property type 
        @type string
        @default 'text'
        **/
        type: 'text',
        /**
        Url for submit, e.g. <code>'/post'</code>  
        If function - it will be called instead of ajax. Function should return deferred object to run fail/done callbacks.

        @property url 
        @type string|function
        @default null
        @example
        url: function(params) {
            var d = new $.Deferred;
            if(params.value === 'abc') {
                return d.reject('error message'); //returning error via deferred object
            } else {
                //async saving data in js model
                someModel.asyncSaveMethod({
                   ..., 
                   success: function(){
                      d.resolve();
                   }
                }); 
                return d.promise();
            }
        } 
        **/        
        url:null,
        /**
        Additional params for submit. If defined as <code>object</code> - it is **appended** to original ajax data (pk, name and value).  
        If defined as <code>function</code> - returned object **overwrites** original ajax data.
        @example
        params: function(params) {
            //originally params contain pk, name and value
            params.a = 1;
            return params;
        }

        @property params 
        @type object|function
        @default null
        **/          
        params:null,
        /**
        Name of field. Will be submitted on server. Can be taken from <code>id</code> attribute

        @property name 
        @type string
        @default null
        **/         
        name: null,
        /**
        Primary key of editable object (e.g. record id in database). For composite keys use object, e.g. <code>{id: 1, lang: 'en'}</code>.
        Can be calculated dynamically via function.

        @property pk 
        @type string|object|function
        @default null
        **/         
        pk: null,
        /**
        Initial value. If not defined - will be taken from element's content.
        For __select__ type should be defined (as it is ID of shown text).

        @property value 
        @type string|object
        @default null
        **/        
        value: null,
        /**
        Value that will be displayed in input if original field value is empty (`null|undefined|''`).

        @property defaultValue 
        @type string|object
        @default null
        @since 1.4.6
        **/        
        defaultValue: null,
        /**
        Strategy for sending data on server. Can be `auto|always|never`.
        When 'auto' data will be sent on server **only if pk and url defined**, otherwise new value will be stored locally.

        @property send 
        @type string
        @default 'auto'
        **/          
        send: 'auto', 
        /**
        Function for client-side validation. If returns string - means validation not passed and string showed as error.
        Since 1.5.1 you can modify submitted value by returning object from `validate`: 
        `{newValue: '...'}` or `{newValue: '...', msg: '...'}`

        @property validate 
        @type function
        @default null
        @example
        validate: function(value) {
            if($.trim(value) == '') {
                return 'This field is required';
            }
        }
        **/         
        validate: null,
        /**
        Success callback. Called when value successfully sent on server and **response status = 200**.  
        Usefull to work with json response. For example, if your backend response can be <code>{success: true}</code>
        or <code>{success: false, msg: "server error"}</code> you can check it inside this callback.  
        If it returns **string** - means error occured and string is shown as error message.  
        If it returns **object like** <code>{newValue: &lt;something&gt;}</code> - it overwrites value, submitted by user.  
        Otherwise newValue simply rendered into element.
        
        @property success 
        @type function
        @default null
        @example
        success: function(response, newValue) {
            if(!response.success) return response.msg;
        }
        **/          
        success: null,
        /**
        Error callback. Called when request failed (response status != 200).  
        Usefull when you want to parse error response and display a custom message.
        Must return **string** - the message to be displayed in the error block.
                
        @property error 
        @type function
        @default null
        @since 1.4.4
        @example
        error: function(response, newValue) {
            if(response.status === 500) {
                return 'Service unavailable. Please try later.';
            } else {
                return response.responseText;
            }
        }
        **/          
        error: null,
        /**
        Additional options for submit ajax request.
        List of values: http://api.jquery.com/jQuery.ajax
        
        @property ajaxOptions 
        @type object
        @default null
        @since 1.1.1        
        @example 
        ajaxOptions: {
            type: 'put',
            dataType: 'json'
        }        
        **/        
        ajaxOptions: null,
        /**
        Where to show buttons: left(true)|bottom|false  
        Form without buttons is auto-submitted.

        @property showbuttons 
        @type boolean|string
        @default true
        @since 1.1.1
        **/         
        showbuttons: true,
        /**
        Scope for callback methods (success, validate).  
        If <code>null</code> means editableform instance itself. 

        @property scope 
        @type DOMElement|object
        @default null
        @since 1.2.0
        @private
        **/            
        scope: null,
        /**
        Whether to save or cancel value when it was not changed but form was submitted

        @property savenochange 
        @type boolean
        @default false
        @since 1.2.0
        **/
        savenochange: false
    };   

    /*
    Note: following params could redefined in engine: bootstrap or jqueryui:
    Classes 'control-group' and 'editable-error-block' must always present!
    */      
    $.fn.editableform.template = '<form class="form-inline editableform">'+
    '<div class="control-group">' + 
    '<div><div class="editable-input"></div><div class="editable-buttons"></div></div>'+
    '<div class="editable-error-block"></div>' + 
    '</div>' + 
    '</form>';

    //loading div
    $.fn.editableform.loading = '<div class="editableform-loading"></div>';

    //buttons
    $.fn.editableform.buttons = '<button type="submit" class="editable-submit">ok</button>'+
    '<button type="button" class="editable-cancel">cancel</button>';      

    //error class attached to control-group
    $.fn.editableform.errorGroupClass = null;  

    //error class attached to editable-error-block
    $.fn.editableform.errorBlockClass = 'editable-error';
    
    //engine
    $.fn.editableform.engine = 'jquery';
}(window.jQuery));

/**
* EditableForm utilites
*/
(function ($) {
    "use strict";
    
    //utils
    $.fn.editableutils = {
        /**
        * classic JS inheritance function
        */  
        inherit: function (Child, Parent) {
            var F = function() { };
            F.prototype = Parent.prototype;
            Child.prototype = new F();
            Child.prototype.constructor = Child;
            Child.superclass = Parent.prototype;
        },

        /**
        * set caret position in input
        * see http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
        */        
        setCursorPosition: function(elem, pos) {
            if (elem.setSelectionRange) {
                elem.setSelectionRange(pos, pos);
            } else if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        },

        /**
        * function to parse JSON in *single* quotes. (jquery automatically parse only double quotes)
        * That allows such code as: <a data-source="{'a': 'b', 'c': 'd'}">
        * safe = true --> means no exception will be thrown
        * for details se<root><item name="eventLogQueue_Online" value="[{&quot;log&quot;:{&quot;type&quot;:0,&quot;impressionGuid&quot;:&quot;04D63C4D7E1E442DB77BF2B445E79117&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856096,&quot;data&quot;:{&quot;eventType&quot;:&quot;CPT&quot;,&quot;eventData&quot;:{&quot;CurUrl&quot;:&quot;https://www.bing.com/AS/API/WindowsCortanaPane/V2/Init&quot;,&quot;Pivot&quot;:&quot;QF&quot;,&quot;pp&quot;:{&quot;S&quot;:&quot;L&quot;,&quot;FC&quot;:58,&quot;BC&quot;:58,&quot;H&quot;:109,&quot;BP&quot;:110,&quot;CT&quot;:110,&quot;IL&quot;:0},&quot;NS&quot;:&quot;1491815503340&quot;,&quot;w3c&quot;:&quot;1ffdf0,,,,,,4,,,7d,,,,,,1,-7e&quot;,&quot;nav&quot;:0,&quot;TS&quot;:1491819856096,&quot;RTS&quot;:4352737,&quot;SEQ&quot;:5},&quot;dataSources&quot;:null,&quot;pageLayout&quot;:null},&quot;dominantImpressionGuid&quot;:null},&quot;lastSendErrorTimeStamp&quot;:0,&quot;inProgress&quot;:false,&quot;size&quot;:611,&quot;flights&quot;:&quot;d-thshld39,d-thshld42,d-thshld78,d-thshldspcl40,k060ct2&quot;},{&quot;log&quot;:{&quot;type&quot;:1,&quot;impressionGuid&quot;:&quot;8d877e4401ae4553822d43d030dea581&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856127,&quot;data&quot;:{&quot;dataSources&quot;:[],&quot;layoutNodes&quot;:[],&quot;pageName&quot;:&quot;Page.SmartSearch.AS.Suggestions&quot;,&quot;rawQuery&quot;:&quot;a&quot;,&quot;isQuery&quot;:false,&quot;impressionUrl&quot;:&quot;https://www.bing.com/QF_KEYSTROKE_VIRTUAL_URL?qry=a&amp;cc=IN&amp;setlang=en-US&amp;cp=1&amp;cvid=454f1cae1c47439c9030e59d02fb187d&amp;ig=8d877e4401ae4553822d43d030dea581&amp;ASInitIG=04D63C4D7E1E442DB77BF2B445E79117&quot;,&quot;appName&quot;:&quot;SmartSearch&quot;,&quot;enrichedClientInfo&quot;:{&quot;MUID&quot;:&quot;B5FC423B429442D798EED4CCD1148280&quot;,&quot;ACVer&quot;:&quot;ff2756ea&quot;,&quot;FDPartnerEntry&quot;:&quot;autosuggest&quot;,&quot;nclid&quot;:&quot;8DCEA49FBCF9109598A862C484F1878F&quot;,&quot;isOffline&quot;:0,&quot;webRequested&quot;:1,&quot;entryPoint&quot;:&quot;WNSSTB&quot;,&quot;previousExperience&quot;:&quot;SearchBox&quot;,&quot;deviceHistoryEnabled&quot;:1,&quot;DeviceID&quot;:&quot;{6FBBF7BD-D183-4575-A4EF-3C90E440031C}&quot;,&quot;IsTouch&quot;:&quot;false&quot;,&quot;OSSKU&quot;:&quot;48&quot;,&quot;AppLifetimeID&quot;:&quot;4BA81A7828804E25919A873DD8EA4658&quot;,&quot;CortanaOptIn&quot;:&quot;true&quot;,&quot;CortanaCapabilities&quot;:&quot;CortanaExperience&quot;},&quot;clientTimestamp&quot;:1491819856127,&quot;impressionGuid&quot;:&quot;8d877e4401ae4553822d43d030dea581&quot;,&quot;uxClassification&quot;:{&quot;client&quot;:&quot;windows&quot;},&quot;userInfoOverrides&quot;:{},&quot;eventData&quot;:{&quot;CurUrl&quot;:&quot;https://www.bing.com/AS/API/WindowsCortanaPane/V2/Init&quot;,&quot;Pivot&quot;:&quot;QF&quot;}}},&quot;lastSendErrorTimeStamp&quot;:0,&quot;inProgress&quot;:false,&quot;size&quot;:1313,&quot;flights&quot;:&quot;d-thshld39,d-thshld42,d-thshld78,d-thshldspcl40,k060ct2&quot;},{&quot;log&quot;:{&quot;type&quot;:0,&quot;impressionGuid&quot;:&quot;8d877e4401ae4553822d43d030dea581&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856177,&quot;data&quot;:{&quot;eventType&quot;:&quot;ClientInst&quot;,&quot;eventData&quot;:{&quot;CurUrl&quot;:&quot;https://www.bing.com/AS/API/WindowsCortanaPane/V2/Init&quot;,&quot;Pivot&quot;:&quot;QF&quot;,&quot;T&quot;:&quot;CI.QFPerfPing&quot;,&quot;ST&quot;:&quot;Keystroke&quot;,&quot;CVID&quot;:&quot;454f1cae1c47439c9030e59d02fb187d&quot;,&quot;OFFSETS&quot;:[{&quot;I&quot;:1,&quot;PL&quot;:1,&quot;K&quot;:29,&quot;RRT&quot;:{&quot;PP&quot;:55,&quot;CG&quot;:61,&quot;ST&quot;:63,&quot;MRU&quot;:69,&quot;MPP&quot;:70,&quot;MST&quot;:74,&quot;MFF&quot;:75},&quot;RFT&quot;:{},&quot;TRR&quot;:[],&quot;IRT&quot;:{}}],&quot;V&quot;:&quot;2&quot;,&quot;RFC&quot;:{},&quot;TS&quot;:1491819856177,&quot;RTS&quot;:4352818,&quot;SEQ&quot;:6},&quot;dataSources&quot;:null,&quot;pageLayout&quot;:null},&quot;dominantImpressionGuid&quot;:null},&quot;lastSendErrorTimeStamp&quot;:0,&quot;inProgress&quot;:false,&quot;size&quot;:712,&quot;flights&quot;:&quot;d-thshld39,d-thshld42,d-thshld78,d-thshldspcl40,k060ct2&quot;},{&quot;log&quot;:{&quot;type&quot;:0,&quot;impressionGuid&quot;:&quot;04D63C4D7E1E442DB77BF2B445E79117&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856350,&quot;data&quot;:{&quot;eventType&quot;:&quot;ClientInst&quot;,&quot;eventData&quot;:{&quot;CurUrl&quot;:&quot;https://www.bing.com/AS/API/WindowsCortanaPane/V2/Init&quot;,&quot;Pivot&quot;:&quot;QF&quot;,&quot;T&quot;:&quot;CI.QFPerfPing&quot;,&quot;ST&quot;:&quot;AppCache&quot;,&quot;CVID&quot;:&quot;454f1cae1c47439c9030e59d02fb187d&quot;,&quot;OFFSETS&quot;:[{&quot;I&quot;:3,&quot;E&quot;:{&quot;0&quot;:1491819856098,&quot;3&quot;:1491819856350},&quot;S&quot;:{},&quot;ABT&quot;:1491819856098}],&quot;V&quot;:&quot;2&quot;,&quot;TS&quot;:1491819856350,&quot;RTS&quot;:4352991,&quot;SEQ&quot;:7},&quot;dataSources&quot;:null,&quot;pageLayout&quot;:null},&quot;dominantImpressionGuid&quot;:null},&quot;lastSendErrorTimeStamp&quot;:0,&quot;inProgress&quot;:false,&quot;size&quot;:662,&quot;flights&quot;:&quot;d-thshld39,d-thshld42,d-thshld78,d-thshldspcl40,k060ct2&quot;},{&quot;log&quot;:{&quot;type&quot;:1,&quot;impressionGuid&quot;:&quot;68141ca01079431b9f705006f1be44ec&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856177,&quot;data&quot;:{&quot;dataSources&quot;:[{&quot;T&quot;:&quot;D.Aggregator&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;Aggregator&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;DS&quot;:[],&quot;rankerModelIds&quot;:{&quot;fastRankModelId&quot;:&quot;STH_0801878a-7127-4f45-ae68-66708db55c29&quot;}},{&quot;T&quot;:&quot;D.LocalApps&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;LocalApps&quot;,&quot;SC&quot;:1,&quot;DS&quot;:[{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1001,&quot;Q&quot;:&quot;Alarms &amp; Clock&quot;,&quot;Val&quot;:&quot;PP&quot;,&quot;Ho&quot;:2,&quot;Gr&quot;:0,&quot;DeviceSignals&quot;:{&quot;Rank&quot;:6033,&quot;PHits&quot;:&quot;System.ParsingName&quot;,&quot;Id&quot;:&quot;Microsoft.WindowsAlarms_8wekyb3d8bbwe!App&quot;,&quot;DName&quot;:&quot;Alarms &amp; Clock&quot;,&quot;LAD&quot;:&quot;2017-03-15T23:06:56.861Z&quot;,&quot;AppLnch&quot;:0,&quot;Args&quot;:0,&quot;MDN&quot;:1,&quot;Ext&quot;:&quot;&quot;},&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.8163898057807148,&quot;featureStore&quot;:{&quot;0&quot;:0.71758,&quot;1&quot;:1,&quot;3&quot;:0.00072,&quot;5&quot;:&quot;0.079&quot;,&quot;6&quot;:572032.48,&quot;7&quot;:6033,&quot;8&quot;:1,&quot;9&quot;:25.47036511574074,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:12,&quot;15&quot;:14,&quot;16&quot;:6033,&quot;18&quot;:&quot;0.082&quot;,&quot;22&quot;:3,&quot;24&quot;:&quot;0.089&quot;,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.631&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;70&quot;:0,&quot;83&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;92&quot;:0,&quot;93&quot;:1,&quot;94&quot;:0.83368,&quot;95&quot;:23702,&quot;133&quot;:1,&quot;134&quot;:12,&quot;135&quot;:3,&quot;136&quot;:0,&quot;137&quot;:14,&quot;148&quot;:0,&quot;154&quot;:0.71758,&quot;155&quot;:0.83368,&quot;157&quot;:1,&quot;158&quot;:0,&quot;159&quot;:6032,&quot;264&quot;:0,&quot;265&quot;:12}}}]},{&quot;T&quot;:&quot;D.BCSApps&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;BCSApps&quot;,&quot;SC&quot;:1,&quot;DS&quot;:[{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1002,&quot;Q&quot;:&quot;Alarms &amp; Clock&quot;,&quot;Val&quot;:&quot;BQP&quot;,&quot;Ho&quot;:2,&quot;Gr&quot;:0,&quot;DeviceSignals&quot;:{&quot;Rank&quot;:0,&quot;PHits&quot;:&quot;System.ParsingName&quot;,&quot;Id&quot;:&quot;Microsoft.WindowsAlarms_8wekyb3d8bbwe!App&quot;,&quot;DName&quot;:&quot;Alarms &amp; Clock&quot;,&quot;LAD&quot;:&quot;2017-03-15T23:06:56.861Z&quot;,&quot;AppLnch&quot;:0,&quot;Args&quot;:0,&quot;MDN&quot;:1,&quot;Ext&quot;:&quot;&quot;}}]},{&quot;T&quot;:&quot;D.LocalFiles&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;LocalFiles&quot;,&quot;SC&quot;:4,&quot;DS&quot;:[{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1003,&quot;Val&quot;:&quot;FL&quot;,&quot;Ho&quot;:2,&quot;Gr&quot;:7,&quot;DeviceSignals&quot;:{&quot;Rank&quot;:995,&quot;PHits&quot;:&quot;System.FileName,System.Search.Contents,System.ItemUrl,System.ItemNameDisplay,System.ItemPathDisplay,System.ParsingName,{9E5E05AC-1936-4A75-94F7-4704B8B01923},0&quot;,&quot;Ext&quot;:&quot;.java&quot;,&quot;CDT&quot;:&quot;2017-04-05T12:56:10.776Z&quot;,&quot;LMD&quot;:&quot;2017-04-05T12:56:10.776Z&quot;},&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.09658116779828313,&quot;featureStore&quot;:{&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;8&quot;:1,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;15&quot;:2,&quot;16&quot;:995,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;24&quot;:&quot;0.089&quot;,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.074&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;61&quot;:1,&quot;65&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;131&quot;:77939859,&quot;133&quot;:1,&quot;134&quot;:25,&quot;135&quot;:6.25,&quot;136&quot;:0,&quot;137&quot;:27,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:25,&quot;268&quot;:4.8945096296296295}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1004,&quot;Val&quot;:&quot;FL&quot;,&quot;Ho&quot;:2,&quot;Gr&quot;:7,&quot;DeviceSignals&quot;:{&quot;Rank&quot;:995,&quot;PHits&quot;:&quot;System.FileName,System.Search.Contents,System.ItemUrl,System.ItemNameDisplay,System.ItemPathDisplay,System.ParsingName,{9E5E05AC-1936-4A75-94F7-4704B8B01923},0&quot;,&quot;Ext&quot;:&quot;.java&quot;,&quot;CDT&quot;:&quot;2017-04-05T12:56:10.775Z&quot;,&quot;LMD&quot;:&quot;2017-04-05T12:56:10.775Z&quot;},&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.09658116779828313,&quot;featureStore&quot;:{&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;8&quot;:1,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;15&quot;:2,&quot;16&quot;:995,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;24&quot;:&quot;0.089&quot;,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.074&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;61&quot;:1,&quot;65&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;131&quot;:324745177,&quot;133&quot;:1,&quot;134&quot;:19,&quot;135&quot;:4.75,&quot;136&quot;:0,&quot;137&quot;:21,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:19,&quot;268&quot;:4.894509652777778}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1005,&quot;Val&quot;:&quot;FL&quot;,&quot;Ho&quot;:2,&quot;Gr&quot;:7,&quot;DeviceSignals&quot;:{&quot;Rank&quot;:995,&quot;PHits&quot;:&quot;System.FileName,System.Search.Contents,System.ItemUrl,System.ItemFolderPathDisplay,System.ItemNameDisplay,System.ItemPathDisplay,System.ParsingName,System.Title,{9E5E05AC-1936-4A75-94F7-4704B8B01923},0,{C82BF597-B831-11D0-B733-00AA00A1EBD2},-797964332&quot;,&quot;Ext&quot;:&quot;.html&quot;,&quot;CDT&quot;:&quot;2017-02-14T08:13:27.128Z&quot;,&quot;LMD&quot;:&quot;2017-01-09T01:02:02.000Z&quot;},&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.09658116779828313,&quot;featureStore&quot;:{&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;8&quot;:1,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;15&quot;:2,&quot;16&quot;:995,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;24&quot;:&quot;0.089&quot;,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.074&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;61&quot;:1,&quot;65&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;131&quot;:725592893,&quot;133&quot;:1,&quot;134&quot;:18,&quot;135&quot;:4.5,&quot;136&quot;:0,&quot;137&quot;:20,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:18,&quot;268&quot;:91.39044454861111}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1006,&quot;Val&quot;:&quot;FL&quot;,&quot;Ho&quot;:2,&quot;Gr&quot;:7,&quot;DeviceSignals&quot;:{&quot;Rank&quot;:895,&quot;PHits&quot;:&quot;System.FileName,System.Search.Contents,System.ItemNameDisplay,System.ParsingName,{9E5E05AC-1936-4A75-94F7-4704B8B01923},0&quot;,&quot;Ext&quot;:&quot;.h&quot;,&quot;CDT&quot;:&quot;2017-04-05T12:56:10.914Z&quot;,&quot;LMD&quot;:&quot;2017-04-05T12:56:10.915Z&quot;},&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.036584350410285314,&quot;featureStore&quot;:{&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;8&quot;:1,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;15&quot;:2,&quot;16&quot;:895,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;24&quot;:&quot;0.089&quot;,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.074&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;61&quot;:1,&quot;65&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;131&quot;:-1102782153,&quot;133&quot;:1,&quot;134&quot;:16,&quot;135&quot;:4,&quot;136&quot;:0,&quot;137&quot;:18,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:16,&quot;268&quot;:4.8945080324074075}}}]},{&quot;T&quot;:&quot;D.WebSuggestions&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;WebSuggestions&quot;,&quot;SC&quot;:8,&quot;DS&quot;:[{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1007,&quot;Q&quot;:&quot;allahabad bank&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0.0169531442224979,&quot;HCS&quot;:&quot;0.264800012111664&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;11021:\&quot;0.0539\&quot;;2152:\&quot;11464\&quot;;2200:\&quot;14\&quot;;2000:\&quot;42405\&quot;;2011:\&quot;1\&quot;;11001:\&quot;1\&quot;;11034:\&quot;1557000939\&quot;;10015:\&quot;160122\&quot;;10018:\&quot;42405\&quot;;&quot;,&quot;PCS&quot;:0.231730177998543,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.007054061648153851,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:12,&quot;15&quot;:14,&quot;17&quot;:0.0169531442224979,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:3,&quot;23&quot;:0.231730177998543,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:12,&quot;135&quot;:3,&quot;136&quot;:0,&quot;137&quot;:14,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:12}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1008,&quot;Q&quot;:&quot;aliexpress&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;11849\&quot;;2200:\&quot;14\&quot;;2000:\&quot;28854\&quot;;2011:\&quot;2\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.006193744793680937,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:8,&quot;15&quot;:10,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:2,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:8,&quot;135&quot;:2,&quot;136&quot;:0,&quot;137&quot;:10,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:8}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1009,&quot;Q&quot;:&quot;allahabad high court&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;12084\&quot;;2200:\&quot;14\&quot;;2000:\&quot;22811\&quot;;2011:\&quot;3\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.0068859278899502975,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:18,&quot;15&quot;:20,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:4.5,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:18,&quot;135&quot;:4.5,&quot;136&quot;:0,&quot;137&quot;:20,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:18}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1010,&quot;Q&quot;:&quot;allsec.smartpay.accenture/accenture login&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;12516\&quot;;2200:\&quot;14\&quot;;2000:\&quot;14809\&quot;;2011:\&quot;4\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.0066942684401852595,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:39,&quot;15&quot;:41,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:9.75,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:39,&quot;135&quot;:9.75,&quot;136&quot;:0,&quot;137&quot;:41,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:39}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1011,&quot;Q&quot;:&quot;alkemites&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;12553\&quot;;2200:\&quot;14\&quot;;2000:\&quot;14271\&quot;;2011:\&quot;5\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.006193744793680937,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:7,&quot;15&quot;:9,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:1.75,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:7,&quot;135&quot;:1.75,&quot;136&quot;:0,&quot;137&quot;:9,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:7}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1012,&quot;Q&quot;:&quot;alibaba&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;12666\&quot;;2200:\&quot;14\&quot;;2000:\&quot;12746\&quot;;2011:\&quot;6\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.005505601728666375,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:5,&quot;15&quot;:7,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:1.25,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:5,&quot;135&quot;:1.25,&quot;136&quot;:0,&quot;137&quot;:7,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:5}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1013,&quot;Q&quot;:&quot;ali asgar chandan quit kapil sharma show&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;12709\&quot;;2200:\&quot;14\&quot;;2000:\&quot;12210\&quot;;2011:\&quot;7\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.0066942684401852595,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:38,&quot;15&quot;:40,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:9.5,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:38,&quot;135&quot;:9.5,&quot;136&quot;:0,&quot;137&quot;:40,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:38}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1014,&quot;Q&quot;:&quot;alia bhatt&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;12725\&quot;;2200:\&quot;14\&quot;;2000:\&quot;12016\&quot;;2011:\&quot;8\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.006193744793680937,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;14&quot;:8,&quot;15&quot;:10,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;22&quot;:2,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.078&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:8,&quot;135&quot;:2,&quot;136&quot;:0,&quot;137&quot;:10,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:8}}}]},{&quot;T&quot;:&quot;D.ContentGroup&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;NonSuggestions&quot;,&quot;SC&quot;:1,&quot;DS&quot;:[{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:114,&quot;Q&quot;:null,&quot;Val&quot;:&quot;SW&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.0044428169172977365,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.079&quot;,&quot;7&quot;:6033,&quot;10&quot;:2,&quot;12&quot;:&quot;3.22E-4&quot;,&quot;15&quot;:2,&quot;18&quot;:&quot;0.082&quot;,&quot;19&quot;:1,&quot;24&quot;:&quot;0.089&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.727&quot;,&quot;28&quot;:&quot;0.022&quot;,&quot;29&quot;:&quot;0.078&quot;,&quot;30&quot;:&quot;0.007&quot;,&quot;31&quot;:&quot;0.074&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.045&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.047&quot;,&quot;37&quot;:&quot;0.007&quot;,&quot;38&quot;:&quot;951955&quot;,&quot;39&quot;:&quot;0.043&quot;,&quot;40&quot;:&quot;0.631&quot;,&quot;41&quot;:&quot;0.045&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.037&quot;,&quot;52&quot;:&quot;0.018&quot;,&quot;53&quot;:&quot;0.012&quot;,&quot;54&quot;:&quot;0.001&quot;,&quot;56&quot;:&quot;0.001&quot;,&quot;57&quot;:&quot;0&quot;,&quot;59&quot;:1,&quot;60&quot;:0,&quot;65&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;132&quot;:1,&quot;137&quot;:2,&quot;148&quot;:0,&quot;264&quot;:0}}}]}],&quot;layoutNodes&quot;:[{&quot;T&quot;:&quot;L.Box&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Region&quot;:&quot;Core&quot;,&quot;L&quot;:[{&quot;T&quot;:&quot;L.Box&quot;,&quot;Region&quot;:&quot;TopHit&quot;,&quot;L&quot;:[{&quot;T&quot;:&quot;L.Url&quot;,&quot;K&quot;:&quot;1001.1&quot;}]},{&quot;T&quot;:&quot;L.Box&quot;,&quot;Region&quot;:&quot;Groups&quot;,&quot;L&quot;:[{&quot;T&quot;:&quot;L.Box&quot;,&quot;Region&quot;:&quot;Documents&quot;,&quot;L&quot;:[{&quot;T&quot;:&quot;L.Url&quot;,&quot;K&quot;:&quot;1003.1&quot;},{&quot;T&quot;:&quot;L.Url&quot;,&quot;K&quot;:&quot;1004.1&quot;},{&quot;T&quot;:&quot;L.Url&quot;,&quot;K&quot;:&quot;1005.1&quot;},{&quot;T&quot;:&quot;L.Url&quot;,&quot;K&quot;:&quot;1006.1&quot;}]},{&quot;T&quot;:&quot;L.Box&quot;,&quot;Region&quot;:&quot;SearchSuggestions&quot;,&quot;L&quot;:[{&quot;T&quot;:&quot;L.Url&quot;,&quot;K&quot;:&quot;114.1&quot;}]}]}]}],&quot;pageName&quot;:&quot;Page.SmartSearch.AS.Suggestions&quot;,&quot;rawQuery&quot;:&quot;al&quot;,&quot;isQuery&quot;:false,&quot;impressionUrl&quot;:&quot;https://www.bing.com/QF_KEYSTROKE_VIRTUAL_URL?qry=al&amp;cc=IN&amp;setlang=en-US&amp;cp=2&amp;cvid=454f1cae1c47439c9030e59d02fb187d&amp;ig=68141ca01079431b9f705006f1be44ec&amp;ASInitIG=04D63C4D7E1E442DB77BF2B445E79117&quot;,&quot;appName&quot;:&quot;SmartSearch&quot;,&quot;enrichedClientInfo&quot;:{&quot;MUID&quot;:&quot;B5FC423B429442D798EED4CCD1148280&quot;,&quot;ACVer&quot;:&quot;ff2756ea&quot;,&quot;FDPartnerEntry&quot;:&quot;autosuggest&quot;,&quot;nclid&quot;:&quot;8DCEA49FBCF9109598A862C484F1878F&quot;,&quot;isOffline&quot;:0,&quot;webRequested&quot;:1,&quot;entryPoint&quot;:&quot;WNSSTB&quot;,&quot;previousExperience&quot;:&quot;SearchBox&quot;,&quot;deviceHistoryEnabled&quot;:1,&quot;DeviceID&quot;:&quot;{6FBBF7BD-D183-4575-A4EF-3C90E440031C}&quot;,&quot;IsTouch&quot;:&quot;false&quot;,&quot;OSSKU&quot;:&quot;48&quot;,&quot;AppLifetimeID&quot;:&quot;4BA81A7828804E25919A873DD8EA4658&quot;,&quot;CortanaOptIn&quot;:&quot;true&quot;,&quot;CortanaCapabilities&quot;:&quot;CortanaExperience&quot;},&quot;clientTimestamp&quot;:1491819856177,&quot;impressionGuid&quot;:&quot;68141ca01079431b9f705006f1be44ec&quot;,&quot;uxClassification&quot;:{&quot;client&quot;:&quot;windows&quot;},&quot;userInfoOverrides&quot;:{},&quot;eventData&quot;:{&quot;CurUrl&quot;:&quot;https://www.bing.com/AS/API/WindowsCortanaPane/V2/Init&quot;,&quot;Pivot&quot;:&quot;QF&quot;}}},&quot;lastSendErrorTimeStamp&quot;:0,&quot;inProgress&quot;:false,&quot;size&quot;:14199,&quot;flights&quot;:&quot;d-thshld39,d-thshld42,d-thshld78,d-thshldspcl40,k060ct2&quot;},{&quot;log&quot;:{&quot;type&quot;:0,&quot;impressionGuid&quot;:&quot;68141ca01079431b9f705006f1be44ec&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856442,&quot;data&quot;:{&quot;eventType&quot;:&quot;ClientInst&quot;,&quot;eventData&quot;:{&quot;CurUrl&quot;:&quot;https://www.bing.com/AS/API/WindowsCortanaPane/V2/Init&quot;,&quot;Pivot&quot;:&quot;QF&quot;,&quot;T&quot;:&quot;CI.QFPerfPing&quot;,&quot;ST&quot;:&quot;Keystroke&quot;,&quot;CVID&quot;:&quot;454f1cae1c47439c9030e59d02fb187d&quot;,&quot;OFFSETS&quot;:[{&quot;I&quot;:2,&quot;PL&quot;:2,&quot;K&quot;:79,&quot;RRT&quot;:{&quot;PP&quot;:86,&quot;ST&quot;:88,&quot;CG&quot;:89,&quot;MRU&quot;:92,&quot;MPP&quot;:92,&quot;MST&quot;:92,&quot;MFF&quot;:92,&quot;BCS&quot;:151,&quot;BQP&quot;:152,&quot;BQS&quot;:153,&quot;LM&quot;:235,&quot;FL&quot;:253,&quot;Web&quot;:307,&quot;OSTMA&quot;:309,&quot;QS&quot;:309},&quot;RFT&quot;:{&quot;PP&quot;:223,&quot;BQP&quot;:223,&quot;BQS&quot;:223,&quot;MPP&quot;:223,&quot;MST&quot;:223,&quot;CG&quot;:223},&quot;TRR&quot;:[{&quot;V&quot;:231,&quot;T&quot;:&quot;PP&quot;}],&quot;IRT&quot;:{&quot;1001.1T&quot;:{&quot;B&quot;:188,&quot;E&quot;:227,&quot;T&quot;:&quot;PP&quot;},&quot;1003.1S&quot;:{&quot;B&quot;:313,&quot;E&quot;:-2,&quot;T&quot;:&quot;FL&quot;},&quot;1004.1S&quot;:{&quot;B&quot;:315,&quot;E&quot;:-2,&quot;T&quot;:&quot;FL&quot;},&quot;1005.1S&quot;:{&quot;B&quot;:316,&quot;E&quot;:-2,&quot;T&quot;:&quot;FL&quot;},&quot;1006.1S&quot;:{&quot;B&quot;:318,&quot;E&quot;:-2,&quot;T&quot;:&quot;FL&quot;}}}],&quot;V&quot;:&quot;2&quot;,&quot;RFC&quot;:{},&quot;TS&quot;:1491819856442,&quot;RTS&quot;:4353083,&quot;SEQ&quot;:8},&quot;dataSources&quot;:null,&quot;pageLayout&quot;:null},&quot;dominantImpressionGuid&quot;:null},&quot;lastSendErrorTimeStamp&quot;:0,&quot;inProgress&quot;:false,&quot;size&quot;:1046,&quot;flights&quot;:&quot;d-thshld39,d-thshld42,d-thshld78,d-thshldspcl40,k060ct2&quot;},{&quot;log&quot;:{&quot;type&quot;:1,&quot;impressionGuid&quot;:&quot;eecc2bf7aac34b15976b151e41f16af3&quot;,&quot;previousImpressionGuid&quot;:null,&quot;timestamp&quot;:1491819856442,&quot;data&quot;:{&quot;dataSources&quot;:[{&quot;T&quot;:&quot;D.Aggregator&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;Aggregator&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;DS&quot;:[],&quot;rankerModelIds&quot;:{&quot;fastRankModelId&quot;:&quot;STH_0801878a-7127-4f45-ae68-66708db55c29&quot;,&quot;ciVersion&quot;:&quot;14&quot;,&quot;bcsVersion&quot;:&quot;C61&quot;}},{&quot;T&quot;:&quot;D.WebSuggestions&quot;,&quot;AppNS&quot;:&quot;SmartSearch&quot;,&quot;Service&quot;:&quot;AutoSuggest&quot;,&quot;Scenario&quot;:&quot;WebSuggestions&quot;,&quot;SC&quot;:8,&quot;DS&quot;:[{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1001,&quot;Q&quot;:&quot;alpental&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0.129499539732933,&quot;HCS&quot;:&quot;0.616599977016449&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;11021:\&quot;0.1375\&quot;;2152:\&quot;12770\&quot;;2200:\&quot;14\&quot;;2000:\&quot;11487\&quot;;2011:\&quot;1\&quot;;11001:\&quot;1\&quot;;11034:\&quot;1557000939\&quot;;10015:\&quot;18629\&quot;;10018:\&quot;11487\&quot;;&quot;,&quot;PCS&quot;:0.579244613647461,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.18512481869325936,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.049&quot;,&quot;10&quot;:3,&quot;12&quot;:&quot;7.77E-6&quot;,&quot;14&quot;:5,&quot;15&quot;:8,&quot;17&quot;:0.129499539732933,&quot;18&quot;:&quot;0.128&quot;,&quot;19&quot;:1,&quot;22&quot;:0.8333333333333334,&quot;23&quot;:0.579244613647461,&quot;24&quot;:&quot;0.149&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.634&quot;,&quot;28&quot;:&quot;0.04&quot;,&quot;29&quot;:&quot;0.202&quot;,&quot;30&quot;:&quot;0.027&quot;,&quot;31&quot;:&quot;0.175&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.097&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.079&quot;,&quot;37&quot;:&quot;0.017&quot;,&quot;38&quot;:&quot;15968&quot;,&quot;39&quot;:&quot;0.018&quot;,&quot;40&quot;:&quot;0.285&quot;,&quot;41&quot;:&quot;0.202&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.067&quot;,&quot;52&quot;:&quot;0.012&quot;,&quot;53&quot;:&quot;0.021&quot;,&quot;54&quot;:&quot;0&quot;,&quot;56&quot;:&quot;0&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:5,&quot;135&quot;:0.8333333333333334,&quot;136&quot;:0,&quot;137&quot;:8,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:5}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1002,&quot;Q&quot;:&quot;alpha mind power&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;14640\&quot;;2200:\&quot;14\&quot;;2000:\&quot;1770\&quot;;2011:\&quot;2\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.04134886196708526,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.049&quot;,&quot;10&quot;:3,&quot;12&quot;:&quot;7.77E-6&quot;,&quot;14&quot;:13,&quot;15&quot;:16,&quot;18&quot;:&quot;0.128&quot;,&quot;19&quot;:1,&quot;22&quot;:2.1666666666666665,&quot;24&quot;:&quot;0.149&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.634&quot;,&quot;28&quot;:&quot;0.04&quot;,&quot;29&quot;:&quot;0.202&quot;,&quot;30&quot;:&quot;0.027&quot;,&quot;31&quot;:&quot;0.175&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.097&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.079&quot;,&quot;37&quot;:&quot;0.017&quot;,&quot;38&quot;:&quot;15968&quot;,&quot;39&quot;:&quot;0.018&quot;,&quot;40&quot;:&quot;0.285&quot;,&quot;41&quot;:&quot;0.202&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.067&quot;,&quot;52&quot;:&quot;0.012&quot;,&quot;53&quot;:&quot;0.021&quot;,&quot;54&quot;:&quot;0&quot;,&quot;56&quot;:&quot;0&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:13,&quot;135&quot;:2.1666666666666665,&quot;136&quot;:0,&quot;137&quot;:16,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:13}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1003,&quot;Q&quot;:&quot;alphabet&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;14894\&quot;;2200:\&quot;14\&quot;;2000:\&quot;1373\&quot;;2011:\&quot;3\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.03599363050361924,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.049&quot;,&quot;10&quot;:3,&quot;12&quot;:&quot;7.77E-6&quot;,&quot;14&quot;:5,&quot;15&quot;:8,&quot;18&quot;:&quot;0.128&quot;,&quot;19&quot;:1,&quot;22&quot;:0.8333333333333334,&quot;24&quot;:&quot;0.149&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.634&quot;,&quot;28&quot;:&quot;0.04&quot;,&quot;29&quot;:&quot;0.202&quot;,&quot;30&quot;:&quot;0.027&quot;,&quot;31&quot;:&quot;0.175&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.097&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.079&quot;,&quot;37&quot;:&quot;0.017&quot;,&quot;38&quot;:&quot;15968&quot;,&quot;39&quot;:&quot;0.018&quot;,&quot;40&quot;:&quot;0.285&quot;,&quot;41&quot;:&quot;0.202&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.067&quot;,&quot;52&quot;:&quot;0.012&quot;,&quot;53&quot;:&quot;0.021&quot;,&quot;54&quot;:&quot;0&quot;,&quot;56&quot;:&quot;0&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:5,&quot;135&quot;:0.8333333333333334,&quot;136&quot;:0,&quot;137&quot;:8,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:5}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1004,&quot;Q&quot;:&quot;alprazolam&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;15017\&quot;;2200:\&quot;14\&quot;;2000:\&quot;1214\&quot;;2011:\&quot;4\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.03730646533006321,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.049&quot;,&quot;10&quot;:3,&quot;12&quot;:&quot;7.77E-6&quot;,&quot;14&quot;:7,&quot;15&quot;:10,&quot;18&quot;:&quot;0.128&quot;,&quot;19&quot;:1,&quot;22&quot;:1.1666666666666667,&quot;24&quot;:&quot;0.149&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.634&quot;,&quot;28&quot;:&quot;0.04&quot;,&quot;29&quot;:&quot;0.202&quot;,&quot;30&quot;:&quot;0.027&quot;,&quot;31&quot;:&quot;0.175&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.097&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.079&quot;,&quot;37&quot;:&quot;0.017&quot;,&quot;38&quot;:&quot;15968&quot;,&quot;39&quot;:&quot;0.018&quot;,&quot;40&quot;:&quot;0.285&quot;,&quot;41&quot;:&quot;0.202&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.067&quot;,&quot;52&quot;:&quot;0.012&quot;,&quot;53&quot;:&quot;0.021&quot;,&quot;54&quot;:&quot;0&quot;,&quot;56&quot;:&quot;0&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:7,&quot;135&quot;:1.1666666666666667,&quot;136&quot;:0,&quot;137&quot;:10,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:7}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1005,&quot;Q&quot;:&quot;alprax&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;15506\&quot;;2200:\&quot;14\&quot;;2000:\&quot;744\&quot;;2011:\&quot;5\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.03599363050361924,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.049&quot;,&quot;10&quot;:3,&quot;12&quot;:&quot;7.77E-6&quot;,&quot;14&quot;:3,&quot;15&quot;:6,&quot;18&quot;:&quot;0.128&quot;,&quot;19&quot;:1,&quot;22&quot;:0.5,&quot;24&quot;:&quot;0.149&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.634&quot;,&quot;28&quot;:&quot;0.04&quot;,&quot;29&quot;:&quot;0.202&quot;,&quot;30&quot;:&quot;0.027&quot;,&quot;31&quot;:&quot;0.175&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.097&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.079&quot;,&quot;37&quot;:&quot;0.017&quot;,&quot;38&quot;:&quot;15968&quot;,&quot;39&quot;:&quot;0.018&quot;,&quot;40&quot;:&quot;0.285&quot;,&quot;41&quot;:&quot;0.202&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.067&quot;,&quot;52&quot;:&quot;0.012&quot;,&quot;53&quot;:&quot;0.021&quot;,&quot;54&quot;:&quot;0&quot;,&quot;56&quot;:&quot;0&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:3,&quot;135&quot;:0.5,&quot;136&quot;:0,&quot;137&quot;:6,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:3}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1006,&quot;Q&quot;:&quot;alphanumeric characters&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;15563\&quot;;2200:\&quot;14\&quot;;2000:\&quot;703\&quot;;2011:\&quot;6\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.04524505688814932,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quot;0.049&quot;,&quot;10&quot;:3,&quot;12&quot;:&quot;7.77E-6&quot;,&quot;14&quot;:20,&quot;15&quot;:23,&quot;18&quot;:&quot;0.128&quot;,&quot;19&quot;:1,&quot;22&quot;:3.3333333333333335,&quot;24&quot;:&quot;0.149&quot;,&quot;25&quot;:1,&quot;26&quot;:&quot;0.634&quot;,&quot;28&quot;:&quot;0.04&quot;,&quot;29&quot;:&quot;0.202&quot;,&quot;30&quot;:&quot;0.027&quot;,&quot;31&quot;:&quot;0.175&quot;,&quot;32&quot;:&quot;0.001&quot;,&quot;33&quot;:&quot;0&quot;,&quot;34&quot;:&quot;0.097&quot;,&quot;35&quot;:&quot;0&quot;,&quot;36&quot;:&quot;0.079&quot;,&quot;37&quot;:&quot;0.017&quot;,&quot;38&quot;:&quot;15968&quot;,&quot;39&quot;:&quot;0.018&quot;,&quot;40&quot;:&quot;0.285&quot;,&quot;41&quot;:&quot;0.202&quot;,&quot;50&quot;:&quot;0&quot;,&quot;51&quot;:&quot;0.067&quot;,&quot;52&quot;:&quot;0.012&quot;,&quot;53&quot;:&quot;0.021&quot;,&quot;54&quot;:&quot;0&quot;,&quot;56&quot;:&quot;0&quot;,&quot;57&quot;:&quot;0&quot;,&quot;60&quot;:0,&quot;70&quot;:0,&quot;82&quot;:1,&quot;91&quot;:&quot;0&quot;,&quot;93&quot;:1,&quot;133&quot;:1,&quot;134&quot;:20,&quot;135&quot;:3.3333333333333335,&quot;136&quot;:0,&quot;137&quot;:23,&quot;148&quot;:0,&quot;264&quot;:0,&quot;265&quot;:20}}},{&quot;T&quot;:&quot;D.Url&quot;,&quot;K&quot;:1007,&quot;Q&quot;:&quot;alpemix&quot;,&quot;Val&quot;:&quot;AS&quot;,&quot;Ho&quot;:0,&quot;Gr&quot;:11,&quot;HCMS&quot;:0,&quot;HCS&quot;:&quot;0&quot;,&quot;LM&quot;:&quot;1000:\&quot;0\&quot;;2152:\&quot;15565\&quot;;2200:\&quot;14\&quot;;2000:\&quot;702\&quot;;2011:\&quot;7\&quot;;11034:\&quot;1557000939\&quot;;&quot;,&quot;PCS&quot;:0,&quot;PC&quot;:false,&quot;RankerSignals&quot;:{&quot;rankingScore&quot;:0.03599363050361924,&quot;featureStore&quot;:{&quot;4&quot;:1,&quot;5&quot;:&quotfrom several elements.    
            If value of some editable is `null` or `undefined` it is excluded from result object.
            When param `isSingle` is set to **true** - it is supposed you have single element and will return value of editable instead of object.   
             
            @method getValue()
            @param {bool} isSingle whether to return just value of single element
            @returns {Object} object of element names and values
            @example
            $('#username, #fullname').editable('getValue');
            //result:
            {
            username: "superuser",
            fullname: "John"
            }
            //isSingle = true
            $('#username').editable('getValue', true);
            //result "superuser" 
            **/
            case 'getValue':
                if(arguments.length === 2 && arguments[1] === true) { //isSingle = true
                    result = this.eq(0).data(datakey).value;
                } else {
                    this.each(function () {
                        var $this = $(this), data = $this.data(datakey);
                        if (data && data.value !== undefined && data.value !== null) {
                            result[data.options.name] = data.input.value2submit(data.value);
                        }
                    });
                }
            return result;

            /**
            This method collects values from several editable elements and submit them all to server.   
            Internally it runs client-side validation for all fields and submits only in case of success.  
            See <a href="#newrecord">creating new records</a> for details.  
            Since 1.5.1 `submit` can be applied to single element to send data programmatically. In that case
            `url`, `success` and `error` is taken from initial options and you can just call `$('#username').editable('submit')`. 
            
            @method submit(options)
            @param {object} options 
            @param {object} options.url url to submit data 
            @param {object} options.data additional data to submit
            @param {object} options.ajaxOptions additional ajax options
            @param {function} options.error(obj) error handler 
            @param {function} options.success(obj,config) success handler
            @returns {Object} jQuery object
            **/
            case 'submit':  //collects value, validate and submit to server for creating new record
                var config = arguments[1] || {},
                $elems = this,
                errors = this.editable('validate');

                // validation ok
                if($.isEmptyObject(errors)) {
                    var ajaxOptions = {};
                                                      
                    // for single element use url, success etc from options
                    if($elems.length === 1) {
                        var editable = $elems.data('editable');
                        //standard params
                        var params = {
                            name: editable.options.name || '',
                            value: editable.input.value2submit(editable.value),
                            pk: (typeof editable.options.pk === 'function') ? 
                                editable.options.pk.call(editable.options.scope) : 
                                editable.options.pk 
                        };

                        //additional params
                        if(typeof editable.options.params === 'function') {
                            params = editable.options.params.call(editable.options.scope, params);  
                        } else {
                            //try parse json in single quotes (from data-params attribute)
                            editable.options.params = $.fn.editableutils.tryParseJson(editable.options.params, true);   
                            $.extend(params, editable.options.params);
                        }

                        ajaxOptions = {
                            url: editable.options.url,
                            data: params,
                            type: 'POST'  
                        };
                        
                        // use success / error from options 
                        config.success = config.success || editable.options.success;
                        config.error = config.error || editable.options.error;
                        
                    // multiple elements
                    } else {
                        var values = this.editable('getValue'); 
                        
                        ajaxOptions = {
                            url: config.url,
                            data: values, 
                            type: 'POST'
                        };                        
                    }                    

                    // ajax success callabck (response 200 OK)
                    ajaxOptions.success = typeof config.success === 'function' ? function(response) {
                            config.success.call($elems, response, config);
                        } : $.noop;
                                  
                    // ajax error callabck
                    ajaxOptions.error = typeof config.error === 'function' ? function() {
                             config.error.apply($elems, arguments);
                        } : $.noop;
                       
                    // extend ajaxOptions    
                    if(config.ajaxOptions) { 
                        $.extend(ajaxOptions, config.ajaxOptions);
                    }
                    
                    // extra data 
                    if(config.data) {
                        $.extend(ajaxOptions.data, config.data);
                    }                     
                    
                    // perform ajax request
                    $.ajax(ajaxOptions);
                } else { //client-side validation error
                    if(typeof config.error === 'function') {
                        config.error.call($elems, errors);
                    }
                }
            return this;
        }

        //return jquery object
        return this.each(function () {
            var $this = $(this), 
                data = $this.data(datakey), 
                options = typeof option === 'object' && option;

            //for delegated targets do not store `editable` object for element
            //it's allows several different selectors.
            //see: https://github.com/vitalets/x-editable/issues/312    
            if(options && options.selector) {
                data = new Editable(this, options);
                return; 
            }    
            
            if (!data) {
                $this.data(datakey, (data = new Editable(this, options)));
            }

            if (typeof option === 'string') { //call method 
                data[option].apply(data, Array.prototype.slice.call(args, 1));
            } 
        });
    };    
            

    $.fn.editable.defaults = {
        /**
        Type of input. Can be <code>text|textarea|select|date|checklist</code> and more

        @property type 
        @type string
        @default 'text'
        **/
        type: 'text',        
        /**
        Sets disabled state of editable

        @property disabled 
        @type boolean
        @default false
        **/         
        disabled: false,
        /**
        How to toggle editable. Can be <code>click|dblclick|mouseenter|manual</code>.   
        When set to <code>manual</code> you should manually call <code>show/hide</code> methods of editable.    
        **Note**: if you call <code>show</code> or <code>toggle</code> inside **click** handler of some DOM element, 
        you need to apply <code>e.stopPropagation()</code> because containers are being closed on any click on document.
        
        @example
        $('#edit-button').click(function(e) {
            e.stopPropagation();
            $('#username').editable('toggle');
        });

        @property toggle 
        @type string
        @default 'click'
        **/          
        toggle: 'click',
        /**
        Text shown when element is empty.

        @property emptytext 
        @type string
        @default 'Empty'
        **/         
        emptytext: 'Empty',
        /**
        Allows to automatically set element's text based on it's value. Can be <code>auto|always|never</code>. Useful for select and date.
        For example, if dropdown list is <code>{1: 'a', 2: 'b'}</code> and element's value set to <code>1</code>, it's html will be automatically set to <code>'a'</code>.  
        <code>auto</code> - text will be automatically set only if element is empty.  
        <code>always|never</code> - always(never) try to set element's text.

        @property autotext 
        @type string
        @default 'auto'
        **/          
        autotext: 'auto', 
        /**
        Initial value of input. If not set, taken from element's text.  
        Note, that if element's text is empty - text is automatically generated from value and can be customized (see `autotext` option).  
        For example, to display currency sign:
        @example
        <a id="price" data-type="text" data-value="100"></a>
        <script>
        $('#price').editable({
            ...
            display: function(value) {
              $(this).text(value + '$');
            } 
        }) 
        </script>
                
        @property value 
        @type mixed
        @default element's text
        **/
        value: null,
        /**
        Callback to perform custom displaying of value in element's text.  
        If `null`, default input's display used.  
        If `false`, no displaying methods will be called, element's text will never change.  
        Runs under element's scope.  
        _**Parameters:**_  
        
        * `value` current value to be displayed
        * `response` server response (if display called after ajax submit), since 1.4.0
         
        For _inputs with source_ (select, checklist) parameters are different:  
          
        * `value` current value to be displayed
        * `sourceData` array of items for current input (e.g. dropdown items) 
        * `response` server response (if display called after ajax submit), since 1.4.0
                  
        To get currently selected items use `$.fn.editableutils.itemsByValue(value, sourceData)`.
        
        @property display 
        @type function|boolean
        @default null
        @since 1.2.0
        @example
        display: function(value, sourceData) {
           //display checklist as comma-separated values
           var html = [],
               checked = $.fn.editableutils.itemsByValue(value, sourceData);
               
           if(checked.length) {
               $.each(checked, function(i, v) { html.push($.fn.editableutils.escape(v.text)); });
               $(this).html(html.join(', '));
           } else {
               $(this).empty(); 
           }
        }
        **/          
        display: null,
        /**
        Css class applied when editable text is empty.

        @property emptyclass 
        @type string
        @since 1.4.1        
        @default editable-empty
        **/        
        emptyclass: 'editable-empty',
        /**
        Css class applied when value was stored but not sent to server (`pk` is empty or `send = 'never'`).  
        You may set it to `null` if you work with editables locally and submit them together.  

        @property unsavedclass 
        @type string
        @since 1.4.1        
        @default editable-unsaved
        **/        
        unsavedclass: 'editable-unsaved',
        /**
        If selector is provided, editable will be delegated to the specified targets.  
        Usefull for dynamically generated DOM elements.  
        **Please note**, that delegated targets can't be initialized with `emptytext` and `autotext` options, 
        as they actually become editable only after first click.  
        You should manually set class `editable-click` to these elements.  
        Also, if element originally empty you should add class `editable-empty`, set `data-value=""` and write emptytext into element:

        @property selector 
        @type string
        @since 1.4.1        
        @default null
        @example
        <div id="user">
          <!-- empty -->
          <a href="#" data-name="username" data-type="text" class="editable-click editable-empty" data-value="" title="Username">Empty</a>
          <!-- non-empty -->
          <a href="#" data-name="group" data-type="select" data-source="/groups" data-value="1" class="editable-click" title="Group">Operator</a>
        </div>     
        
        <script>
        $('#user').editable({
            selector: 'a',
            url: '/post',
            pk: 1
        });
        </script>
        **/         
        selector: null,
        /**
        Color used to highlight element after update. Implemented via CSS3 transition, works in modern browsers.
        
        @property highlight 
        @type string|boolean
        @since 1.4.5        
        @default #FFFF80 
        **/
        highlight: '#FFFF80'
    };
    
}(window.jQuery));

/**
AbstractInput - base class for all editable inputs.
It defines interface to be implemented by any input type.
To create your own input you can inherit from this class.

@class abstractinput
**/
(function ($) {
    "use strict";

    //types
    $.fn.editabletypes = {};

    var AbstractInput = function () { };

    AbstractInput.prototype = {
       /**
        Initializes input

        @method init() 
        **/
       init: function(type, options, defaults) {
           this.type = type;
           this.options = $.extend({}, defaults, options);
       },

       /*
       this method called before render to init $tpl that is inserted in DOM
       */
       prerender: function() {
           this.$tpl = $(this.options.tpl); //whole tpl as jquery object    
           this.$input = this.$tpl;         //control itself, can be changed in render method
           this.$clear = null;              //clear button
           this.error = null;               //error message, if input cannot be rendered           
       },
       
       /**
        Renders input from tpl. Can return jQuery deferred object.
        Can be overwritten in child objects

        @method render()
       **/
       render: function() {

       }, 

       /**
        Sets element's html by value. 

        @method value2html(value, element)
        @param {mixed} value
        @param {DOMElement} element
       **/
       value2html: function(value, element) {
           $(element)[this.options.escape ? 'text' : 'html']($.trim(value));
       },

       /**
        Converts element's html to value

        @method html2value(html)
        @param {string} html
        @returns {mixed}
       **/
       html2value: function(html) {
           return $('<div>').html(html).text();
       },

       /**
        Converts value to string (for internal compare). For submitting to server used value2submit().

        @method value2str(value) 
        @param {mixed} value
        @returns {string}
       **/
       value2str: function(value) {
           return value;
       }, 

       /**
        Converts string received from server into value. Usually from `data-value` attribute.

        @method str2value(str)
        @param {string} str
        @returns {mixed}
       **/
       str2value: function(str) {
           return str;
       }, 
       
       /**
        Converts value for submitting to server. Result can be string or object.

        @method value2submit(value) 
        @param {mixed} value
        @returns {mixed}
       **/
       value2submit: function(value) {
           return value;
       },

       /**
        Sets value of input.

        @method value2input(value) 
        @param {mixed} value
       **/
       value2input: function(value) {
           this.$input.val(value);
       },

       /**
        Returns value of input. Value can be object (e.g. datepicker)

        @method input2value() 
       **/
       input2value: function() { 
           return this.$input.val();
       }, 

       /**
        Activates input. For text it sets focus.

        @method activate() 
       **/
       activate: function() {
           if(this.$input.is(':visible')) {
               this.$input.focus();
           }
       },

       /**
        Creates input.

        @method clear() 
       **/        
       clear: function() {
           this.$input.val(null);
       },

       /**
        method to escape html.
       **/
       escape: function(str) {
           return $('<div>').text(str).html();
       },
       
       /**
        attach handler to automatically submit form when value changed (useful when buttons not shown)
       **/
       autosubmit: function() {
        
       },
       
       /**
       Additional actions when destroying element 
       **/
       destroy: function() {
       },

       // -------- helper functions --------
       setClass: function() {          
           if(this.options.inputclass) {
               this.$input.addClass(this.options.inputclass); 
           } 
       },

       setAttr: function(attr) {
           if (this.options[attr] !== undefined && this.options[attr] !== null) {
               this.$input.attr(attr, this.options[attr]);
           } 
       },
       
       option: function(key, value) {
            this.options[key] = value;
       }
       
    };
        
    AbstractInput.defaults = {  
        /**
        HTML template of input. Normally you should not change it.

        @property tpl 
        @type string
        @default ''
        **/   
        tpl: '',
        /**
        CSS class automatically applied to input
        
        @property inputclass 
        @type string
        @default null
        **/         
        inputclass: null,
        
        /**
        If `true` - html will be escaped in content of element via $.text() method.  
        If `false` - html will not be escaped, $.html() used.  
        When you use own `display` function, this option obviosly has no effect.
        
        @property escape 
        @type boolean
        @since 1.5.0
        @default true
        **/         
        escape: true,
                
        //scope for external methods (e.g. source defined as function)
        //for internal use only
        scope: null,
        
        //need to re-declare showbuttons here to get it's value from common config (passed only options existing in defaults)
        showbuttons: true 
    };
    
    $.extend($.fn.editabletypes, {abstractinput: AbstractInput});
        
}(window.jQuery));

/**
List - abstract class for inputs that have source option loaded from js array or via ajax

@class list
@extends abstractinput
**/
(function ($) {
    "use strict";
    
    var List = function (options) {
       
    };

    $.fn.editableutils.inherit(List, $.fn.editabletypes.abstractinput);

    $.extend(List.prototype, {
        render: function () {
            var deferred = $.Deferred();

            this.error = null;
            this.onSourceReady(function () {
                this.renderList();
                deferred.resolve();
            }, function () {
                this.error = this.options.sourceError;
                deferred.resolve();
            });

            return deferred.promise();
        },

        html2value: function (html) {
            return null; //can't set value by text
        },
        
        value2html: function (value, element, display, response) {
            var deferred = $.Deferred(),
                success = function () {
                    if(typeof display === 'function') {
                        //custom display method
                        display.call(element, value, this.sourceData, response); 
                    } else {
                        this.value2htmlFinal(value, element);
                    }
                    deferred.resolve();
               };
            
            //for null value just call success without loading source
            if(value === null) {
               success.call(this);   
            } else {
               this.onSourceReady(success, function () { deferred.resolve(); });
            }

            return deferred.promise();
        },  

        // ------------- additional functions ------------

        onSourceReady: function (success, error) {
            //run source if it function
            var source;
            if ($.isFunction(this.options.source)) {
                source = this.options.source.call(this.options.scope);
                this.sourceData = null;
                //note: if function returns the same source as URL - sourceData will be taken from cahce and no extra request performed
            } else {
                source = this.options.source;
            }            
            
            //if allready loaded just call success
            if(this.options.sourceCache && $.isArray(this.sourceData)) {
                success.call(this);
                return; 
            }

            //try parse json in single quotes (for double quotes jquery does automatically)
            try {
                source = $.fn.editableutils.tryParseJson(source, false);
            } catch (e) {
                error.call(this);
                return;
            }

            //loading from url
            if (typeof source === 'string') {
                //try to get sourceData from cache
                if(this.options.sourceCache) {
                    var cacheID = source,
                    cache;

                    if (!$(document).data(cacheID)) {
                        $(document).data(cacheID, {});
                    }
                    cache = $(document).data(cacheID);

                    //check for cached data
                    if (cache.loading === false && cache.sourceData) { //take source from cache
                        this.sourceData = cache.sourceData;
                        this.doPrepend();
                        success.call(this);
                        return;
                    } else if (cache.loading === true) { //cache is loading, put callback in stack to be called later
                        cache.callbacks.push($.proxy(function () {
                            this.sourceData = cache.sourceData;
                            this.doPrepend();
                            success.call(this);
                        }, this));

                        //also collecting error callbacks
                        cache.err_callbacks.push($.proxy(error, this));
                        return;
                    } else { //no cache yet, activate it
                        cache.loading = true;
                        cache.callbacks = [];
                        cache.err_callbacks = [];
                    }
                }
                
                //ajaxOptions for source. Can be overwritten bt options.sourceOptions
                var ajaxOptions = $.extend({
                    url: source,
                    type: 'get',
                    cache: false,
                    dataType: 'json',
                    success: $.proxy(function (data) {
                        if(cache) {
                            cache.loading = false;
                        }
                        this.sourceData = this.makeArray(data);
                        if($.isArray(this.sourceData)) {
                            if(cache) {
                                //store result in cache
                                cache.sourceData = this.sourceData;
                                //run success callbacks for other fields waiting for this source
                                $.each(cache.callbacks, function () { this.call(); }); 
                            }
                            this.doPrepend();
                            success.call(this);
                        } else {
                            error.call(this);
                            if(cache) {
                                //run error callbacks for other fields waiting for this source
                                $.each(cache.err_callbacks, function () { this.call(); }); 
                            }
                        }
                    }, this),
                    error: $.proxy(function () {
                        error.call(this);
                        if(cache) {
                             cache.loading = false;
                             //run error callbacks for other fields
                             $.each(cache.err_callbacks, function () { this.call(); }); 
                        }
                    }, this)
                }, this.options.sourceOptions);
                
                //loading sourceData from server
                $.ajax(ajaxOptions);
                
            } else { //options as json/array
                this.sourceData = this.makeArray(source);
                    
                if($.isArray(this.sourceData)) {
                    this.doPrepend();
                    success.call(this);   
                } else {
                    error.call(this);
                }
            }
        },

        doPrepend: function () {
            if(this.options.prepend === null || this.options.prepend === undefined) {
                return;  
            }
            
            if(!$.isArray(this.prependData)) {
                //run prepend if it is function (once)
                if ($.isFunction(this.options.prepend)) {
                    this.options.prepend = this.options.prepend.call(this.options.scope);
                }
              
                //try parse json in single quotes
                this.options.prepend = $.fn.editableutils.tryParseJson(this.options.prepend, true);
                
                //convert prepend from string to object
                if (typeof this.options.prepend === 'string') {
                    this.options.prepend = {'': this.options.prepend};
                }
                
                this.prependData = this.makeArray(this.options.prepend);
            }

            if($.isArray(this.prependData) && $.isArray(this.sourceData)) {
                this.sourceData = this.prependData.concat(this.sourceData);
            }
        },

        /*
         renders input list
        */
        renderList: function() {
            // this method should be overwritten in child class
        },
       
         /*
         set element's html by value
        */
        value2htmlFinal: function(value, element) {
            // this method should be overwritten in child class
        },        

        /**
        * convert data to array suitable for sourceData, e.g. [{value: 1, text: 'abc'}, {...}]
        */
        makeArray: function(data) {
            var count, obj, result = [], item, iterateItem;
            if(!data || typeof data === 'string') {
                return null; 
            }

            if($.isArray(data)) { //array
                /* 
                   function to iterate inside item of array if item is object.
                   Caclulates count of keys in item and store in obj. 
                */
                iterateItem = function (k, v) {
                    obj = {value: k, text: v};
                    if(count++ >= 2) {
                        return false;// exit from `each` if item has more than one key.
                    }
                };
            
                for(var i = 0; i < data.length; i++) {
                    item = data[i]; 
                    if(typeof item === 'object') {
                        count = 0; //count of keys inside item
                        $.each(item, iterateItem);
                        //case: [{val1: 'text1'}, {val2: 'text2} ...]
                        if(count === 1) { 
                            result.push(obj); 
                            //case: [{value: 1, text: 'text1'}, {value: 2, text: 'text2'}, ...]
                        } else if(count > 1) {
                            //removed check of existance: item.hasOwnProperty('value') && item.hasOwnProperty('text')
                            if(item.children) {
                                item.children = this.makeArray(item.children);   
                            }
                            result.push(item);
                        }
                    } else {
                        //case: ['text1', 'text2' ...]
                        result.push({value: item, text: item}); 
                    }
                }
            } else {  //case: {val1: 'text1', val2: 'text2, ...}
                $.each(data, function (k, v) {
                    result.push({value: k, text: v});
                });  
            }
            return result;
        },
        
        option: function(key, value) {
            this.options[key] = value;
            if(key === 'source') {
                this.sourceData = null;
            }
            if(key === 'prepend') {
                this.prependData = null;
            }            
        }        

    });      

    List.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        Source data for list.  
        If **array** - it should be in format: `[{value: 1, text: "text1"}, {value: 2, text: "text2"}, ...]`  
        For compability, object format is also supported: `{"1": "text1", "2": "text2" ...}` but it does not guarantee elements order.
        
        If **string** - considered ajax url to load items. In that case results will be cached for fields with the same source and name. See also `sourceCache` option.
          
        If **function**, it should return data in format above (since 1.4.0).
        
        Since 1.4.1 key `children` supported to render OPTGROUP (for **select** input only).  
        `[{text: "group1", children: [{value: 1, text: "text1"}, {value: 2, text: "text2"}]}, ...]` 

		
        @property source 
        @type string | array | object | function
        @default null
        **/         
        source: null, 
        /**
        Data automatically prepended to the beginning of dropdown list.
        
        @property prepend 
        @type string | array | object | function
        @default false
        **/         
        prepend: false,
        /**
        Error message when list cannot be loaded (e.g. ajax error)
        
        @property sourceError 
        @type string
        @default Error when loading list
        **/          
        sourceError: 'Error when loading list',
        /**
        if <code>true</code> and source is **string url** - results will be cached for fields with the same source.    
        Usefull for editable column in grid to prevent extra requests.
        
        @property sourceCache 
        @type boolean
        @default true
        @since 1.2.0
        **/        
        sourceCache: true,
        /**
        Additional ajax options to be used in $.ajax() when loading list from server.
        Useful to send extra parameters (`data` key) or change request method (`type` key).
        
        @property sourceOptions 
        @type object|function
        @default null
        @since 1.5.0
        **/        
        sourceOptions: null
    });

    $.fn.editabletypes.list = List;      

}(window.jQuery));

/**
Text input

@class text
@extends abstractinput
@final
@example
<a href="#" id="username" data-type="text" data-pk="1">awesome</a>
<script>
$(function(){
    $('#username').editable({
        url: '/post',
        title: 'Enter username'
    });
});
</script>
**/
(function ($) {
    "use strict";
    
    var Text = function (options) {
        this.init('text', options, Text.defaults);
    };

    $.fn.editableutils.inherit(Text, $.fn.editabletypes.abstractinput);

    $.extend(Text.prototype, {
        render: function() {
           this.renderClear();
           this.setClass();
           this.setAttr('placeholder');
        },
        
        activate: function() {
            if(this.$input.is(':visible')) {
                this.$input.focus();
                $.fn.editableutils.setCursorPosition(this.$input.get(0), this.$input.val().length);
                if(this.toggleClear) {
                    this.toggleClear();
                }
            }
        },
        
        //render clear button
        renderClear:  function() {
           if (this.options.clear) {
               this.$clear = $('<span class="editable-clear-x"></span>');
               this.$input.after(this.$clear)
                          .css('padding-right', 24)
                          .keyup($.proxy(function(e) {
                              //arrows, enter, tab, etc
                              if(~$.inArray(e.keyCode, [40,38,9,13,27])) {
                                return;
                              }                            

                              clearTimeout(this.t);
                              var that = this;
                              this.t = setTimeout(function() {
                                that.toggleClear(e);
                              }, 100);
                              
                          }, this))
                          .parent().css('position', 'relative');
                          
               this.$clear.click($.proxy(this.clear, this));                       
           }            
        },
        
        postrender: function() {
            /*
            //now `clear` is positioned via css
            if(this.$clear) {
                //can position clear button only here, when form is shown and height can be calculated
//                var h = this.$input.outerHeight(true) || 20,
                var h = this.$clear.parent().height(),
                    delta = (h - this.$clear.height()) / 2;
                    
                //this.$clear.css({bottom: delta, right: delta});
            }
            */ 
        },
        
        //show / hide clear button
        toggleClear: function(e) {
            if(!this.$clear) {
                return;
            }
            
            var len = this.$input.val().length,
                visible = this.$clear.is(':visible');
                 
            if(len && !visible) {
                this.$clear.show();
            } 
            
            if(!len && visible) {
                this.$clear.hide();
            } 
        },
        
        clear: function() {
           this.$clear.hide();
           this.$input.val('').focus();
        }          
    });

    Text.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <input type="text">
        **/         
        tpl: '<input type="text">',
        /**
        Placeholder attribute of input. Shown when input is empty.

        @property placeholder 
        @type string
        @default null
        **/             
        placeholder: null,
        
        /**
        Whether to show `clear` button 
        
        @property clear 
        @type boolean
        @default true        
        **/
        clear: true
    });

    $.fn.editabletypes.text = Text;

}(window.jQuery));

/**
Textarea input

@class textarea
@extends abstractinput
@final
@example
<a href="#" id="comments" data-type="textarea" data-pk="1">awesome comment!</a>
<script>
$(function(){
    $('#comments').editable({
        url: '/post',
        title: 'Enter comments',
        rows: 10
    });
});
</script>
**/
(function ($) {
    "use strict";
    
    var Textarea = function (options) {
        this.init('textarea', options, Textarea.defaults);
    };

    $.fn.editableutils.inherit(Textarea, $.fn.editabletypes.abstractinput);

    $.extend(Textarea.prototype, {
        render: function () {
            this.setClass();
            this.setAttr('placeholder');
            this.setAttr('rows');                        
            
            //ctrl + enter
            this.$input.keydown(function (e) {
                if (e.ctrlKey && e.which === 13) {
                    $(this).closest('form').submit();
                }
            });
        },
        
       //using `white-space: pre-wrap` solves \n  <--> BR conversion very elegant!
       /* 
       value2html: function(value, element) {
            var html = '', lines;
            if(value) {
                lines = value.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    lines[i] = $('<div>').text(lines[i]).html();
                }
                html = lines.join('<br>');
            }
            $(element).html(html);
        },
       
        html2value: function(html) {
            if(!html) {
                return '';
            }

            var regex = new RegExp(String.fromCharCode(10), 'g');
            var lines = html.split(/<br\s*\/?>/i);
            for (var i = 0; i < lines.length; i++) {
                var text = $('<div>').html(lines[i]).text();

                // Remove newline characters (\n) to avoid them being converted by value2html() method
                // thus adding extra <br> tags
                text = text.replace(regex, '');

                lines[i] = text;
            }
            return lines.join("\n");
        },
         */
        activate: function() {
            $.fn.editabletypes.text.prototype.activate.call(this);
        }
    });

    Textarea.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl
        @default <textarea></textarea>
        **/
        tpl:'<textarea></textarea>',
        /**
        @property inputclass
        @default input-large
        **/
        inputclass: 'input-large',
        /**
        Placeholder attribute of input. Shown when input is empty.

        @property placeholder
        @type string
        @default null
        **/
        placeholder: null,
        /**
        Number of rows in textarea

        @property rows
        @type integer
        @default 7
        **/        
        rows: 7        
    });

    $.fn.editabletypes.textarea = Textarea;

}(window.jQuery));

/**
Select (dropdown)

@class select
@extends list
@final
@example
<a href="#" id="status" data-type="select" data-pk="1" data-url="/post" data-title="Select status"></a>
<script>
$(function(){
    $('#status').editable({
        value: 2,    
        source: [
              {value: 1, text: 'Active'},
              {value: 2, text: 'Blocked'},
              {value: 3, text: 'Deleted'}
           ]
    });
});
</script>
**/
(function ($) {
    "use strict";
    
    var Select = function (options) {
        this.init('select', options, Select.defaults);
    };

    $.fn.editableutils.inherit(Select, $.fn.editabletypes.list);

    $.extend(Select.prototype, {
        renderList: function() {
            this.$input.empty();

            var fillItems = function($el, data) {
                var attr;
                if($.isArray(data)) {
                    for(var i=0; i<data.length; i++) {
                        attr = {};
                        if(data[i].children) {
                            attr.label = data[i].text;
                            $el.append(fillItems($('<optgroup>', attr), data[i].children)); 
                        } else {
                            attr.value = data[i].value;
                            if(data[i].disabled) {
                                attr.disabled = true;
                            }
                            $el.append($('<option>', attr).text(data[i].text)); 
                        }
                    }
                }
                return $el;
            };        

            fillItems(this.$input, this.sourceData);
            
            this.setClass();
            
            //enter submit
            this.$input.on('keydown.editable', function (e) {
                if (e.which === 13) {
                    $(this).closest('form').submit();
                }
            });            
        },
       
        value2htmlFinal: function(value, element) {
            var text = '', 
                items = $.fn.editableutils.itemsByValue(value, this.sourceData);
                
            if(items.length) {
                text = items[0].text;
            }
            
            //$(element).text(text);
            $.fn.editabletypes.abstractinput.prototype.value2html.call(this, text, element);
        },
        
        autosubmit: function() {
            this.$input.off('keydown.editable').on('change.editable', function(){
                $(this).closest('form').submit();
            });
        }
    });      

    Select.defaults = $.extend({}, $.fn.editabletypes.list.defaults, {
        /**
        @property tpl 
        @default <select></select>
        **/         
        tpl:'<select></select>'
    });

    $.fn.editabletypes.select = Select;      

}(window.jQuery));

/**
List of checkboxes. 
Internally value stored as javascript array of values.

@class checklist
@extends list
@final
@example
<a href="#" id="options" data-type="checklist" data-pk="1" data-url="/post" data-title="Select options"></a>
<script>
$(function(){
    $('#options').editable({
        value: [2, 3],    
        source: [
              {value: 1, text: 'option1'},
              {value: 2, text: 'option2'},
              {value: 3, text: 'option3'}
           ]
    });
});
</script>
**/
(function ($) {
    "use strict";
    
    var Checklist = function (options) {
        this.init('checklist', options, Checklist.defaults);
    };

    $.fn.editableutils.inherit(Checklist, $.fn.editabletypes.list);

    $.extend(Checklist.prototype, {
        renderList: function() {
            var $label, $div;
            
            this.$tpl.empty();
            
            if(!$.isArray(this.sourceData)) {
                return;
            }

            for(var i=0; i<this.sourceData.length; i++) {
                $label = $('<label>').append($('<input>', {
                                           type: 'checkbox',
                                           value: this.sourceData[i].value 
                                     }))
                                     .append($('<span>').text(' '+this.sourceData[i].text));
                
                $('<div>').append($label).appendTo(this.$tpl);
            }
            
            this.$input = this.$tpl.find('input[type="checkbox"]');
            this.setClass();
        },
       
       value2str: function(value) {
           return $.isArray(value) ? value.sort().join($.trim(this.options.separator)) : '';
       },  
       
       //parse separated string
        str2value: function(str) {
           var reg, value = null;
           if(typeof str === 'string' && str.length) {
               reg = new RegExp('\\s*'+$.trim(this.options.separator)+'\\s*');
               value = str.split(reg);
           } else if($.isArray(str)) {
               value = str; 
           } else {
               value = [str];
           }
           return value;
        },       
       
       //set checked on required checkboxes
       value2input: function(value) {
            this.$input.prop('checked', false);
            if($.isArray(value) && value.length) {
               this.$input.each(function(i, el) {
                   var $el = $(el);
                   // cannot use $.inArray as it performs strict comparison
                   $.each(value, function(j, val){
                       /*jslint eqeq: true*/
                       if($el.val() == val) {
                       /*jslint eqeq: false*/                           
                           $el.prop('checked', true);
                       }
                   });
               }); 
            }  
        },  
        
       input2value: function() { 
           var checked = [];
           this.$input.filter(':checked').each(function(i, el) {
               checked.push($(el).val());
           });
           return checked;
       },            
          
       //collect text of checked boxes
        value2htmlFinal: function(value, element) {
           var html = [],
               checked = $.fn.editableutils.itemsByValue(value, this.sourceData),
               escape = this.options.escape;
               
           if(checked.length) {
               $.each(checked, function(i, v) {
                   var text = escape ? $.fn.editableutils.escape(v.text) : v.text; 
                   html.push(text); 
               });
               $(element).html(html.join('<br>'));
           } else {
               $(element).empty(); 
           }
        },
        
       activate: function() {
           this.$input.first().focus();
       },
       
       autosubmit: function() {
           this.$input.on('keydown', function(e){
               if (e.which === 13) {
                   $(this).closest('form').submit();
               }
           });
       }
    });      

    Checklist.defaults = $.extend({}, $.fn.editabletypes.list.defaults, {
        /**
        @property tpl 
        @default <div></div>
        **/         
        tpl:'<div class="editable-checklist"></div>',
        
        /**
        @property inputclass 
        @type string
        @default null
        **/         
        inputclass: null,        
        
        /**
        Separator of values when reading from `data-value` attribute

        @property separator 
        @type string
        @default ','
        **/         
        separator: ','
    });

    $.fn.editabletypes.checklist = Checklist;      

}(window.jQuery));

/**
HTML5 input types.
Following types are supported:

* password
* email
* url
* tel
* number
* range
* time

Learn more about html5 inputs:  
http://www.w3.org/wiki/HTML5_form_additions  
To check browser compatibility please see:  
https://developer.mozilla.org/en-US/docs/HTML/Element/Input
            
@class html5types 
@extends text
@final
@since 1.3.0
@example
<a href="#" id="email" data-type="email" data-pk="1">admin@example.com</a>
<script>
$(function(){
    $('#email').editable({
        url: '/post',
        title: 'Enter email'
    });
});
</script>
**/

/**
@property tpl 
@default depends on type
**/ 

/*
Password
*/
(function ($) {
    "use strict";
    
    var Password = function (options) {
        this.init('password', options, Password.defaults);
    };
    $.fn.editableutils.inherit(Password, $.fn.editabletypes.text);
    $.extend(Password.prototype, {
       //do not display password, show '[hidden]' instead
       value2html: function(value, element) {
           if(value) {
               $(element).text('[hidden]');
           } else {
               $(element).empty(); 
           }
       },
       //as password not displayed, should not set value by html
       html2value: function(html) {
           return null;
       }       
    });    
    Password.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
        tpl: '<input type="password">'
    });
    $.fn.editabletypes.password = Password;
}(window.jQuery));


/*
Email
*/
(function ($) {
    "use strict";
    
    var Email = function (options) {
        this.init('email', options, Email.defaults);
    };
    $.fn.editableutils.inherit(Email, $.fn.editabletypes.text);
    Email.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
        tpl: '<input type="email">'
    });
    $.fn.editabletypes.email = Email;
}(window.jQuery));


/*
Url
*/
(function ($) {
    "use strict";
    
    var Url = function (options) {
        this.init('url', options, Url.defaults);
    };
    $.fn.editableutils.inherit(Url, $.fn.editabletypes.text);
    Url.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
        tpl: '<input type="url">'
    });
    $.fn.editabletypes.url = Url;
}(window.jQuery));


/*
Tel
*/
(function ($) {
    "use strict";
    
    var Tel = function (options) {
        this.init('tel', options, Tel.defaults);
    };
    $.fn.editableutils.inherit(Tel, $.fn.editabletypes.text);
    Tel.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
        tpl: '<input type="tel">'
    });
    $.fn.editabletypes.tel = Tel;
}(window.jQuery));


/*
Number
*/
(function ($) {
    "use strict";
    
    var NumberInput = function (options) {
        this.init('number', options, NumberInput.defaults);
    };
    $.fn.editableutils.inherit(NumberInput, $.fn.editabletypes.text);
    $.extend(NumberInput.prototype, {
         render: function () {
            NumberInput.superclass.render.call(this);
            this.setAttr('min');
            this.setAttr('max');
            this.setAttr('step');
        },
        postrender: function() {
            if(this.$clear) {
                //increase right ffset  for up/down arrows
                this.$clear.css({right: 24});
                /*
                //can position clear button only here, when form is shown and height can be calculated
                var h = this.$input.outerHeight(true) || 20,
                    delta = (h - this.$clear.height()) / 2;
                
                //add 12px to offset right for up/down arrows    
                this.$clear.css({top: delta, right: delta + 16});
                */
            } 
        }        
    });     
    NumberInput.defaults = $.extend({}, $.fn.editabletypes.text.defaults, {
        tpl: '<input type="number">',
        inputclass: 'input-mini',
        min: null,
        max: null,
        step: null
    });
    $.fn.editabletypes.number = NumberInput;
}(window.jQuery));


/*
Range (inherit from number)
*/
(function ($) {
    "use strict";
    
    var Range = function (options) {
        this.init('range', options, Range.defaults);
    };
    $.fn.editableutils.inherit(Range, $.fn.editabletypes.number);
    $.extend(Range.prototype, {
        render: function () {
            this.$input = this.$tpl.filter('input');
            
            this.setClass();
            this.setAttr('min');
            this.setAttr('max');
            this.setAttr('step');           
            
            this.$input.on('input', function(){
                $(this).siblings('output').text($(this).val()); 
            });  
        },
        activate: function() {
            this.$input.focus();
        }         
    });
    Range.defaults = $.extend({}, $.fn.editabletypes.number.defaults, {
        tpl: '<input type="range"><output style="width: 30px; display: inline-block"></output>',
        inputclass: 'input-medium'
    });
    $.fn.editabletypes.range = Range;
}(window.jQuery));

/*
Time
*/
(function ($) {
    "use strict";

    var Time = function (options) {
        this.init('time', options, Time.defaults);
    };
    //inherit from abstract, as inheritance from text gives selection error.
    $.fn.editableutils.inherit(Time, $.fn.editabletypes.abstractinput);
    $.extend(Time.prototype, {
        render: function() {
           this.setClass();
        }        
    });
    Time.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        tpl: '<input type="time">'
    });
    $.fn.editabletypes.time = Time;
}(window.jQuery));

/**
Select2 input. Based on amazing work of Igor Vaynberg https://github.com/ivaynberg/select2.  
Please see [original select2 docs](http://ivaynberg.github.com/select2) for detailed description and options.  
 
You should manually download and include select2 distributive:  

    <link href="select2/select2.css" rel="stylesheet" type="text/css"></link>  
    <script src="select2/select2.js"></script>  
    
To make it **bootstrap-styled** you can use css from [here](https://github.com/t0m/select2-bootstrap-css): 

    <link href="select2-bootstrap.css" rel="stylesheet" type="text/css"></link>    
    
**Note:** currently `autotext` feature does not work for select2 with `ajax` remote source.    
You need initially put both `data-value` and element's text youself:    

    <a href="#" data-type="select2" data-value="1">Text1</a>
    
    
@class select2
@extends abstractinput
@since 1.4.1
@final
@example
<a href="#" id="country" data-type="select2" data-pk="1" data-value="ru" data-url="/post" data-title="Select country"></a>
<script>
$(function(){
    //local source
    $('#country').editable({
        source: [
              {id: 'gb', text: 'Great Britain'},
              {id: 'us', text: 'United States'},
              {id: 'ru', text: 'Russia'}
           ],
        select2: {
           multiple: true
        }
    });
    //remote source (simple)
    $('#country').editable({
        source: '/getCountries',
        select2: {
            placeholder: 'Select Country',
            minimumInputLength: 1
        }
    });
    //remote source (advanced)
    $('#country').editable({
        select2: {
            placeholder: 'Select Country',
            allowClear: true,
            minimumInputLength: 3,
            id: function (item) {
                return item.CountryId;
            },
            ajax: {
                url: '/getCountries',
                dataType: 'json',
                data: function (term, page) {
                    return { query: term };
                },
                results: function (data, page) {
                    return { results: data };
                }
            },
            formatResult: function (item) {
                return item.CountryName;
            },
            formatSelection: function (item) {
                return item.CountryName;
            },
            initSelection: function (element, callback) {
                return $.get('/getCountryById', { query: element.val() }, function (data) {
                    callback(data);
                });
            } 
        }  
    });
});
</script>
**/
(function ($) {
    "use strict";
    
    var Constructor = function (options) {
        this.init('select2', options, Constructor.defaults);

        options.select2 = options.select2 || {};

        this.sourceData = null;
        
        //placeholder
        if(options.placeholder) {
            options.select2.placeholder = options.placeholder;
        }
       
        //if not `tags` mode, use source
        if(!options.select2.tags && options.source) {
            var source = options.source;
            //if source is function, call it (once!)
            if ($.isFunction(options.source)) {
                source = options.source.call(options.scope);
            }               

            if (typeof source === 'string') {
                options.select2.ajax = options.select2.ajax || {};
                //some default ajax params
                if(!options.select2.ajax.data) {
                    options.select2.ajax.data = function(term) {return { query:term };};
                }
                if(!options.select2.ajax.results) {
                    options.select2.ajax.results = function(data) { return {results:data };};
                }
                options.select2.ajax.url = source;
            } else {
                //check format and convert x-editable format to select2 format (if needed)
                this.sourceData = this.convertSource(source);
                options.select2.data = this.sourceData;
            }
        } 

        //overriding objects in config (as by default jQuery extend() is not recursive)
        this.options.select2 = $.extend({}, Constructor.defaults.select2, options.select2);

        //detect whether it is multi-valued
        this.isMultiple = this.options.select2.tags || this.options.select2.multiple;
        this.isRemote = ('ajax' in this.options.select2);

        //store function returning ID of item
        //should be here as used inautotext for local source
        this.idFunc = this.options.select2.id;
        if (typeof(this.idFunc) !== "function") {
            var idKey = this.idFunc || 'id';
            this.idFunc = function (e) { return e[idKey]; };
        }

        //store function that renders text in select2
        this.formatSelection = this.options.select2.formatSelection;
        if (typeof(this.formatSelection) !== "function") {
            this.formatSelection = function (e) { return e.text; };
        }
    };

    $.fn.editableutils.inherit(Constructor, $.fn.editabletypes.abstractinput);

    $.extend(Constructor.prototype, {
        render: function() {
            this.setClass();

            //can not apply select2 here as it calls initSelection 
            //over input that does not have correct value yet.
            //apply select2 only in value2input
            //this.$input.select2(this.options.select2);

            //when data is loaded via ajax, we need to know when it's done to populate listData
            if(this.isRemote) {
                //listen to loaded event to populate data
                this.$input.on('select2-loaded', $.proxy(function(e) {
                    this.sourceData = e.items.results;
                }, this));
            }

            //trigger resize of editableform to re-position container in multi-valued mode
            if(this.isMultiple) {
               this.$input.on('change', function() {
                   $(this).closest('form').parent().triggerHandler('resize');
               });
            }
       },

       value2html: function(value, element) {
           var text = '', data,
               that = this;

           if(this.options.select2.tags) { //in tags mode just assign value
              data = value; 
              //data = $.fn.editableutils.itemsByValue(value, this.options.select2.tags, this.idFunc);
           } else if(this.sourceData) {
              data = $.fn.editableutils.itemsByValue(value, this.sourceData, this.idFunc); 
           } else {
              //can not get list of possible values 
              //(e.g. autotext for select2 with ajax source)
           }

           //data may be array (when multiple values allowed)
           if($.isArray(data)) {
               //collect selected data and show with separator
               text = [];
               $.each(data, function(k, v){
                   text.push(v && typeof v === 'object' ? that.formatSelection(v) : v);
               });
           } else if(data) {
               text = that.formatSelection(data);
           }

           text = $.isArray(text) ? text.join(this.options.viewseparator) : text;

           //$(element).text(text);
           Constructor.superclass.value2html.call(this, text, element); 
       },

       html2value: function(html) {
           return this.options.select2.tags ? this.str2value(html, this.options.viewseparator) : null;
       },

       value2input: function(value) {
           // if value array => join it anyway
           if($.isArray(value)) {
              value = value.join(this.getSeparator());
           }

           //for remote source just set value, text is updated by initSelection
           if(!this.$input.data('select2')) {
               this.$input.val(value);
               this.$input.select2(this.options.select2);
           } else {
               //second argument needed to separate initial change from user's click (for autosubmit)   
               this.$input.val(value).trigger('change', true); 

               //Uncaught Error: cannot call val() if initSelection() is not defined
               //this.$input.select2('val', value);
           }

           // if defined remote source AND no multiple mode AND no user's initSelection provided --> 
           // we should somehow get text for provided id.
           // The solution is to use element's text as text for that id (exclude empty)
           if(this.isRemote && !this.isMultiple && !this.options.select2.initSelection) {
               // customId and customText are methods to extract `id` and `text` from data object
               // we can use this workaround only if user did not define these methods
               // otherwise we cant construct data object
               var customId = this.options.select2.id,
                   customText = this.options.select2.formatSelection;

               if(!customId && !customText) {
                   var $el = $(this.options.scope);
                   if (!$el.data('editable').isEmpty) {
                       var data = {id: value, text: $el.text()};
                       this.$input.select2('data', data); 
                   }
               }
           }
       },
       
       input2value: function() { 
           return this.$input.select2('val');
       },

       str2value: function(str, separator) {
            if(typeof str !== 'string' || !this.isMultiple) {
                return str;
            }

            separator = separator || this.getSeparator();

            var val, i, l;

            if (str === null || str.length < 1) {
                return null;
            }
            val = str.split(separator);
            for (i = 0, l = val.length; i < l; i = i + 1) {
                val[i] = $.trim(val[i]);
            }

            return val;
       },

        autosubmit: function() {
            this.$input.on('change', function(e, isInitial){
                if(!isInitial) {
                  $(this).closest('form').submit();
                }
            });
        },

        getSeparator: function() {
            return this.options.select2.separator || $.fn.select2.defaults.separator;
        },

        /*
        Converts source from x-editable format: {value: 1, text: "1"} to
        select2 format: {id: 1, text: "1"}
        */
        convertSource: function(source) {
            if($.isArray(source) && source.length && source[0].value !== undefined) {
                for(var i = 0; i<source.length; i++) {
                    if(source[i].value !== undefined) {
                        source[i].id = source[i].value;
                        delete source[i].value;
                    }
                }
            }
            return source;
        },
        
        destroy: function() {
            if(this.$input.data('select2')) {
                this.$input.select2('destroy');
            }
        }
        
    });

    Constructor.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <input type="hidden">
        **/
        tpl:'<input type="hidden">',
        /**
        Configuration of select2. [Full list of options](http://ivaynberg.github.com/select2).

        @property select2 
        @type object
        @default null
        **/
        select2: null,
        /**
        Placeholder attribute of select

        @property placeholder 
        @type string
        @default null
        **/
        placeholder: null,
        /**
        Source data for select. It will be assigned to select2 `data` property and kept here just for convenience.
        Please note, that format is different from simple `select` input: use 'id' instead of 'value'.
        E.g. `[{id: 1, text: "text1"}, {id: 2, text: "text2"}, ...]`.

        @property source 
        @type array|string|function
        @default null        
        **/
        source: null,
        /**
        Separator used to display tags.

        @property viewseparator 
        @type string
        @default ', '        
        **/
        viewseparator: ', '
    });

    $.fn.editabletypes.select2 = Constructor;

}(window.jQuery));

/**
* Combodate - 1.0.5
* Dropdown date and time picker.
* Converts text input into dropdowns to pick day, month, year, hour, minute and second.
* Uses momentjs as datetime library http://momentjs.com.
* For i18n include corresponding file from https://github.com/timrwood/moment/tree/master/lang 
*
* Confusion at noon and midnight - see http://en.wikipedia.org/wiki/12-hour_clock#Confusion_at_noon_and_midnight
* In combodate: 
* 12:00 pm --> 12:00 (24-h format, midday)
* 12:00 am --> 00:00 (24-h format, midnight, start of day)
* 
* Differs from momentjs parse rules:
* 00:00 pm, 12:00 pm --> 12:00 (24-h format, day not change)
* 00:00 am, 12:00 am --> 00:00 (24-h format, day not change)
* 
* 
* Author: Vitaliy Potapov
* Project page: http://github.com/vitalets/combodate
* Copyright (c) 2012 Vitaliy Potapov. Released under MIT License.
**/
(function ($) {

    var Combodate = function (element, options) {
        this.$element = $(element);
        if(!this.$element.is('input')) {
            $.error('Combodate should be applied to INPUT element');
            return;
        }
        this.options = $.extend({}, $.fn.combodate.defaults, options, this.$element.data());
        this.init();  
     };

    Combodate.prototype = {
        constructor: Combodate, 
        init: function () {
            this.map = {
                //key   regexp    moment.method
                day:    ['D',    'date'], 
                month:  ['M',    'month'], 
                year:   ['Y',    'year'], 
                hour:   ['[Hh]', 'hours'],
                minute: ['m',    'minutes'], 
                second: ['s',    'seconds'],
                ampm:   ['[Aa]', ''] 
            };
            
            this.$widget = $('<span class="combodate"></span>').html(this.getTemplate());
                      
            this.initCombos();
            
            //update original input on change 
            this.$widget.on('change', 'select', $.proxy(function(e) {
                this.$element.val(this.getValue()).change();
                // update days count if month or year changes
                if (this.options.smartDays) {
                    if ($(e.target).is('.month') || $(e.target).is('.year')) {
                        this.fillCombo('day');
                    }
                }
            }, this));
            
            this.$widget.find('select').css('width', 'auto');
                                       
            // hide original input and insert widget                                       
            this.$element.hide().after(this.$widget);
            
            // set initial value
            this.setValue(this.$element.val() || this.options.value);
        },
        
        /*
         Replace tokens in template with <select> elements 
        */         
        getTemplate: function() {
            var tpl = this.options.template;

            //first pass
            $.each(this.map, function(k, v) {
                v = v[0]; 
                var r = new RegExp(v+'+'),
                    token = v.length > 1 ? v.substring(1, 2) : v;
                    
                tpl = tpl.replace(r, '{'+token+'}');
            });

            //replace spaces with &nbsp;
            tpl = tpl.replace(/ /g, '&nbsp;');

            //second pass
            $.each(this.map, function(k, v) {
                v = v[0];
                var token = v.length > 1 ? v.substring(1, 2) : v;
                    
                tpl = tpl.replace('{'+token+'}', '<select class="'+k+'"></select>');
            });   

            return tpl;
        },
        
        /*
         Initialize combos that presents in template 
        */        
        initCombos: function() {
            for (var k in this.map) {
                var $c = this.$widget.find('.'+k);
                // set properties like this.$day, this.$month etc.
                this['$'+k] = $c.length ? $c : null;
                // fill with items
                this.fillCombo(k);
            }
        },

        /*
         Fill combo with items 
        */        
        fillCombo: function(k) {
            var $combo = this['$'+k];
            if (!$combo) {
                return;
            }

            // define method name to fill items, e.g `fillDays`
            var f = 'fill' + k.charAt(0).toUpperCase() + k.slice(1); 
            var items = this[f]();
            var value = $combo.val();

            $combo.empty();
            for(var i=0; i<items.length; i++) {
                $combo.append('<option value="'+items[i][0]+'">'+items[i][1]+'</option>');
            }

            $combo.val(value);
        },

        /*
         Initialize items of combos. Handles `firstItem` option 
        */
        fillCommon: function(key) {
            var values = [],
                relTime;
                
            if(this.options.firstItem === 'name') {
                //need both to support moment ver < 2 and  >= 2
                relTime = moment.relativeTime || moment.langData()._relativeTime; 
                var header = typeof relTime[key] === 'function' ? relTime[key](1, true, key, false) : relTime[key];
                //take last entry (see momentjs lang files structure) 
                header = header.split(' ').reverse()[0];                
                values.push(['', header]);
            } else if(this.options.firstItem === 'empty') {
                values.push(['', '']);
            }
            return values;
        },  


        /*
        fill day
        */
        fillDay: function() {
            var items = this.fillCommon('d'), name, i,
                twoDigit = this.options.template.indexOf('DD') !== -1,
                daysCount = 31;

            // detect days count (depends on month and year)
            // originally https://github.com/vitalets/combodate/pull/7
            if (this.options.smartDays && this.$month && this.$year) {
                var month = parseInt(this.$month.val(), 10);
                var year = parseInt(this.$year.val(), 10);

                if (!isNaN(month) && !isNaN(year)) {
                    daysCount = moment([year, month]).daysInMonth();
                }
            }

            for (i = 1; i <= daysCount; i++) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }
            return items;        
        },
        
        /*
        fill month
        */
        fillMonth: function() {
            var items = this.fillCommon('M'), name, i, 
                longNames = this.options.template.indexOf('MMMM') !== -1,
                shortNames = this.options.template.indexOf('MMM') !== -1,
                twoDigit = this.options.template.indexOf('MM') !== -1;
                
            for(i=0; i<=11; i++) {
                if(longNames) {
                    //see https://github.com/timrwood/momentjs.com/pull/36
                    name = moment().date(1).month(i).format('MMMM');
                } else if(shortNames) {
                    name = moment().date(1).month(i).format('MMM');
                } else if(twoDigit) {
                    name = this.leadZero(i+1);
                } else {
                    name = i+1;
                }
                items.push([i, name]);
            } 
            return items;
        },  
        
        /*
        fill year
        */
        fillYear: function() {
            var items = [], name, i, 
                longNames = this.options.template.indexOf('YYYY') !== -1;
           
            for(i=this.options.maxYear; i>=this.options.minYear; i--) {
                name = longNames ? i : (i+'').substring(2);
                items[this.options.yearDescending ? 'push' : 'unshift']([i, name]);
            }
            
            items = this.fillCommon('y').concat(items);
            
            return items;              
        },    
        
        /*
        fill hour
        */
        fillHour: function() {
            var items = this.fillCommon('h'), name, i,
                h12 = this.options.template.indexOf('h') !== -1,
                h24 = this.options.template.indexOf('H') !== -1,
                twoDigit = this.options.template.toLowerCase().indexOf('hh') !== -1,
                min = h12 ? 1 : 0, 
                max = h12 ? 12 : 23;
                
            for(i=min; i<=max; i++) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            } 
            return items;                 
        },    
        
        /*
        fill minute
        */
        fillMinute: function() {
            var items = this.fillCommon('m'), name, i,
                twoDigit = this.options.template.indexOf('mm') !== -1;

            for(i=0; i<=59; i+= this.options.minuteStep) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }    
            return items;              
        },  
        
        /*
        fill second
        */
        fillSecond: function() {
            var items = this.fillCommon('s'), name, i,
                twoDigit = this.options.template.indexOf('ss') !== -1;

            for(i=0; i<=59; i+= this.options.secondStep) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }    
            return items;              
        },  
        
        /*
        fill ampm
        */
        fillAmpm: function() {
            var ampmL = this.options.template.indexOf('a') !== -1,
                ampmU = this.options.template.indexOf('A') !== -1,            
                items = [
                    ['am', ampmL ? 'am' : 'AM'],
                    ['pm', ampmL ? 'pm' : 'PM']
                ];
            return items;                              
        },                                       

        /*
         Returns current date value from combos. 
         If format not specified - `options.format` used.
         If format = `null` - Moment object returned.
        */
        getValue: function(format) {
            var dt, values = {}, 
                that = this,
                notSelected = false;
                
            //getting selected values    
            $.each(this.map, function(k, v) {
                if(k === 'ampm') {
                    return;
                }
                var def = k === 'day' ? 1 : 0;
                  
                values[k] = that['$'+k] ? parseInt(that['$'+k].val(), 10) : def; 
                
                if(isNaN(values[k])) {
                   notSelected = true;
                   return false; 
                }
            });
            
            //if at least one visible combo not selected - return empty string
            if(notSelected) {
               return '';
            }
            
            //convert hours 12h --> 24h 
            if(this.$ampm) {
                //12:00 pm --> 12:00 (24-h format, midday), 12:00 am --> 00:00 (24-h format, midnight, start of day)
                if(values.hour === 12) {
                    values.hour = this.$ampm.val() === 'am' ? 0 : 12;                    
                } else {
                    values.hour = this.$ampm.val() === 'am' ? values.hour : values.hour+12;
                }
            }    
            
            dt = moment([values.year, values.month, values.day, values.hour, values.minute, values.second]);
            
            //highlight invalid date
            this.highlight(dt);
                              
            format = format === undefined ? this.options.format : format;
            if(format === null) {
               return dt.isValid() ? dt : null; 
            } else {
               return dt.isValid() ? dt.format(format) : ''; 
            }           
        },
        
        setValue: function(value) {
            if(!value) {
                return;
            }
            
            var dt = typeof value === 'string' ? moment(value, this.options.format) : moment(value),
                that = this,
                values = {};
            
            //function to find nearest value in select options
            function getNearest($select, value) {
                var delta = {};
                $select.children('option').each(function(i, opt){
                    var optValue = $(opt).attr('value'),
                    distance;

                    if(optValue === '') return;
                    distance = Math.abs(optValue - value); 
                    if(typeof delta.distance === 'undefined' || distance < delta.distance) {
                        delta = {value: optValue, distance: distance};
                    } 
                }); 
                return delta.value;
            }             
            
            if(dt.isValid()) {
                //read values from date object
                $.each(this.map, function(k, v) {
                    if(k === 'ampm') {
                       return; 
                    }
                    values[k] = dt[v[1]]();
                });
               
                if(this.$ampm) {
                    //12:00 pm --> 12:00 (24-h format, midday), 12:00 am --> 00:00 (24-h format, midnight, start of day)
                    if(values.hour >= 12) {
                        values.ampm = 'pm';
                        if(values.hour > 12) {
                            values.hour -= 12;
                        }
                    } else {
                        values.ampm = 'am';
                        if(values.hour === 0) {
                            values.hour = 12;
                        }
                    } 
                }
               
                $.each(values, function(k, v) {
                    //call val() for each existing combo, e.g. this.$hour.val()
                    if(that['$'+k]) {
                       
                        if(k === 'minute' && that.options.minuteStep > 1 && that.options.roundTime) {
                           v = getNearest(that['$'+k], v);
                        }
                       
                        if(k === 'second' && that.options.secondStep > 1 && that.options.roundTime) {
                           v = getNearest(that['$'+k], v);
                        }                       
                       
                        that['$'+k].val(v);
                    }
                });

                // update days count
                if (this.options.smartDays) {
                    this.fillCombo('day');
                }
               
               this.$element.val(dt.format(this.options.format)).change();
            }
        },
        
        /*
         highlight combos if date is invalid
        */
        highlight: function(dt) {
            if(!dt.isValid()) {
                if(this.options.errorClass) {
                    this.$widget.addClass(this.options.errorClass);
                } else {
                    //store original border color
                    if(!this.borderColor) {
                        this.borderColor = this.$widget.find('select').css('border-color'); 
                    }
                    this.$widget.find('select').css('border-color', 'red');
                } 
            } else {
                if(this.options.errorClass) {
                    this.$widget.removeClass(this.options.errorClass);
                } else {
                    this.$widget.find('select').css('border-color', this.borderColor);
                }  
            }
        },
        
        leadZero: function(v) {
            return v <= 9 ? '0' + v : v; 
        },
        
        destroy: function() {
            this.$widget.remove();
            this.$element.removeData('combodate').show();
        }
        
        //todo: clear method        
    };

    $.fn.combodate = function ( option ) {
        var d, args = Array.apply(null, arguments);
        args.shift();

        //getValue returns date as string / object (not jQuery object)
        if(option === 'getValue' && this.length && (d = this.eq(0).data('combodate'))) {
          return d.getValue.apply(d, args);
        }        
        
        return this.each(function () {
            var $this = $(this),
            data = $this.data('combodate'),
            options = typeof option == 'object' && option;
            if (!data) {
                $this.data('combodate', (data = new Combodate(this, options)));
            }
            if (typeof option == 'string' && typeof data[option] == 'function') {
                data[option].apply(data, args);
            }
        });
    };  
    
    $.fn.combodate.defaults = {
         //in this format value stored in original input
        format: 'DD-MM-YYYY HH:mm',      
        //in this format items in dropdowns are displayed
        template: 'D / MMM / YYYY   H : mm',
        //initial value, can be `new Date()`    
        value: null,                       
        minYear: 1970,
        maxYear: 2015,
        yearDescending: true,
        minuteStep: 5,
        secondStep: 1,
        firstItem: 'empty', //'name', 'empty', 'none'
        errorClass: null,
        roundTime: true, // whether to round minutes and seconds if step > 1
        smartDays: false // whether days in combo depend on selected month: 31, 30, 28
    };

}(window.jQuery));
/**
Combodate input - dropdown date and time picker.    
Based on [combodate](http://vitalets.github.com/combodate) plugin (included). To use it you should manually include [momentjs](http://momentjs.com).

    <script src="js/moment.min.js"></script>
   
Allows to input:

* only date
* only time 
* both date and time  

Please note, that format is taken from momentjs and **not compatible** with bootstrap-datepicker / jquery UI datepicker.  
Internally value stored as `momentjs` object. 

@class combodate
@extends abstractinput
@final
@since 1.4.0
@example
<a href="#" id="dob" data-type="combodate" data-pk="1" data-url="/post" data-value="1984-05-15" data-title="Select date"></a>
<script>
$(function(){
    $('#dob').editable({
        format: 'YYYY-MM-DD',    
        viewformat: 'DD.MM.YYYY',    
        template: 'D / MMMM / YYYY',    
        combodate: {
                minYear: 2000,
                maxYear: 2015,
                minuteStep: 1
           }
        }
    });
});
</script>
**/

/*global moment*/

(function ($) {
    "use strict";
    
    var Constructor = function (options) {
        this.init('combodate', options, Constructor.defaults);
        
        //by default viewformat equals to format
        if(!this.options.viewformat) {
            this.options.viewformat = this.options.format;
        }        
        
        //try parse combodate config defined as json string in data-combodate
        options.combodate = $.fn.editableutils.tryParseJson(options.combodate, true);

        //overriding combodate config (as by default jQuery extend() is not recursive)
        this.options.combodate = $.extend({}, Constructor.defaults.combodate, options.combodate, {
            format: this.options.format,
            template: this.options.template
        });
    };

    $.fn.editableutils.inherit(Constructor, $.fn.editabletypes.abstractinput);    
    
    $.extend(Constructor.prototype, {
        render: function () {
            this.$input.combodate(this.options.combodate);
                    
            if($.fn.editableform.engine === 'bs3') {
                this.$input.siblings().find('select').addClass('form-control');
            }
            
            if(this.options.inputclass) {
                this.$input.siblings().find('select').addClass(this.options.inputclass);
            }            
            //"clear" link
            /*
            if(this.options.clear) {
                this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    this.clear();
                }, this));
                
                this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));  
            } 
            */               
        },
        
        value2html: function(value, element) {
            var text = value ? value.format(this.options.viewformat) : '';
            //$(element).text(text);
            Constructor.superclass.value2html.call(this, text, element);  
        },

        html2value: function(html) {
            return html ? moment(html, this.options.viewformat) : null;
        },   
        
        value2str: function(value) {
            return value ? value.format(this.options.format) : '';
       }, 
       
       str2value: function(str) {
           return str ? moment(str, this.options.format) : null;
       }, 
       
       value2submit: function(value) {
           return this.value2str(value);
       },                    

       value2input: function(value) {
           this.$input.combodate('setValue', value);
       },
        
       input2value: function() { 
           return this.$input.combodate('getValue', null);
       },       
       
       activate: function() {
           this.$input.siblings('.combodate').find('select').eq(0).focus();
       },
       
       /*
       clear:  function() {
          this.$input.data('datepicker').date = null;
          this.$input.find('.active').removeClass('active');
       },
       */
       
       autosubmit: function() {
           
       }

    });
    
    Constructor.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <input type="text">
        **/         
        tpl:'<input type="text">',
        /**
        @property inputclass 
        @default null
        **/         
        inputclass: null,
        /**
        Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
        See list of tokens in [momentjs docs](http://momentjs.com/docs/#/parsing/string-format)  
        
        @property format 
        @type string
        @default YYYY-MM-DD
        **/         
        format:'YYYY-MM-DD',
        /**
        Format used for displaying date. Also applied when converting date from element's text on init.   
        If not specified equals to `format`.
        
        @property viewformat 
        @type string
        @default null
        **/          
        viewformat: null,        
        /**
        Template used for displaying dropdowns.
        
        @property template 
        @type string
        @default D / MMM / YYYY
        **/          
        template: 'D / MMM / YYYY',  
        /**
        Configuration of combodate.
        Full list of options: http://vitalets.github.com/combodate/#docs
        
        @property combodate 
        @type object
        @default null
        **/
        combodate: null
        
        /*
        (not implemented yet)
        Text shown as clear date button. 
        If <code>false</code> clear button will not be rendered.
        
        @property clear 
        @type boolean|string
        @default 'x clear'         
        */
        //clear: '&times; clear'
    });   

    $.fn.editabletypes.combodate = Constructor;

}(window.jQuery));

/*
Editableform based on Twitter Bootstrap 3
*/
(function ($) {
    "use strict";
    
    //store parent methods
    var pInitInput = $.fn.editableform.Constructor.prototype.initInput;
    
    $.extend($.fn.editableform.Constructor.prototype, {
        initTemplate: function() {
            this.$form = $($.fn.editableform.template); 
            this.$form.find('.control-group').addClass('form-group');
            this.$form.find('.editable-error-block').addClass('help-block');
        },
        initInput: function() {  
            pInitInput.apply(this);

            //for bs3 set default class `input-sm` to standard inputs
            var emptyInputClass = this.input.options.inputclass === null || this.input.options.inputclass === false;
            var defaultClass = 'input-sm';
            
            //bs3 add `form-control` class to standard inputs
            var stdtypes = 'text,select,textarea,password,email,url,tel,number,range,time,typeaheadjs'.split(','); 
            if(~$.inArray(this.input.type, stdtypes)) {
                this.input.$input.addClass('form-control');
                if(emptyInputClass) {
                    this.input.options.inputclass = defaultClass;
                    this.input.$input.addClass(defaultClass);
                }
            }             
        
            //apply bs3 size class also to buttons (to fit size of control)
            var $btn = this.$form.find('.editable-buttons');
            var classes = emptyInputClass ? [defaultClass] : this.input.options.inputclass.split(' ');
            for(var i=0; i<classes.length; i++) {
                // `btn-sm` is default now
                /*
                if(classes[i].toLowerCase() === 'input-sm') { 
                    $btn.find('button').addClass('btn-sm');  
                }
                */
                if(classes[i].toLowerCase() === 'input-lg') {
                    $btn.find('button').removeClass('btn-sm').addClass('btn-lg'); 
                }
            }
        }
    });    
    
    //buttons
    $.fn.editableform.buttons = 
      '<button type="submit" class="btn btn-primary btn-sm editable-submit">'+
        '<i class="fa fa-check"></i>'+
      '</button>'+
      '<button type="button" class="btn btn-default btn-sm editable-cancel">'+
        '<i class="fa fa-times" style="color: black;"></i>'+
      '</button>';         
    
    //error classes
    $.fn.editableform.errorGroupClass = 'has-error';
    $.fn.editableform.errorBlockClass = null;  
    //engine
    $.fn.editableform.engine = 'bs3';  
}(window.jQuery));
/**
* Editable Popover3 (for Bootstrap 3) 
* ---------------------
* requires bootstrap-popover.js
*/
(function ($) {
    "use strict";

    //extend methods
    $.extend($.fn.editableContainer.Popup.prototype, {
        containerName: 'popover',
        containerDataName: 'bs.popover',
        innerCss: '.popover-content',
        defaults: $.fn.popover.Constructor.DEFAULTS,

        initContainer: function(){
            $.extend(this.containerOptions, {
                trigger: 'manual',
                selector: false,
                content: ' ',
                template: this.defaults.template
            });
            
            //as template property is used in inputs, hide it from popover
            var t;
            if(this.$element.data('template')) {
               t = this.$element.data('template');
               this.$element.removeData('template');  
            } 
            
            this.call(this.containerOptions);
            
            if(t) {
               //restore data('template')
               this.$element.data('template', t); 
            }
        }, 
        
        /* show */
        innerShow: function () {
            this.call('show');                
        },  
        
        /* hide */
        innerHide: function () {
            this.call('hide');       
        }, 
        
        /* destroy */
        innerDestroy: function() {
            this.call('destroy');
        },                               
        
        setContainerOption: function(key, value) {
            this.container().options[key] = value; 
        },               

        /**
        * move popover to new position. This function mainly copied from bootstrap-popover.
        */
        /*jshint laxcomma: true, eqeqeq: false*/
        setPosition: function () { 

            (function() {
            /*    
                var $tip = this.tip()
                , inside
                , pos
                , actualWidth
                , actualHeight
                , placement
                , tp
                , tpt
                , tpb
                , tpl
                , tpr;

                placement = typeof this.options.placement === 'function' ?
                this.options.placement.call(this, $tip[0], this.$element[0]) :
                this.options.placement;

                inside = /in/.test(placement);
               
                $tip
              //  .detach()
              //vitalets: remove any placement class because otherwise they dont influence on re-positioning of visible popover
                .removeClass('top right bottom left')
                .css({ top: 0, left: 0, display: 'block' });
              //  .insertAfter(this.$element);
               
                pos = this.getPosition(inside);

                actualWidth = $tip[0].offsetWidth;
                actualHeight = $tip[0].offsetHeight;

                placement = inside ? placement.split(' ')[1] : placement;

                tpb = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2};
                tpt = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2};
                tpl = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth};
                tpr = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width};

                switch (placement) {
                    case 'bottom':
                        if ((tpb.top + actualHeight) > ($(window).scrollTop() + $(window).height())) {
                            if (tpt.top > $(window).scrollTop()) {
                                placement = 'top';
                            } else if ((tpr.left + actualWidth) < ($(window).scrollLeft() + $(window).width())) {
                                placement = 'right';
                            } else if (tpl.left > $(window).scrollLeft()) {
                                placement = 'left';
                            } else {
                                placement = 'right';
                            }
                        }
                        break;
                    case 'top':
                        if (tpt.top < $(window).scrollTop()) {
                            if ((tpb.top + actualHeight) < ($(window).scrollTop() + $(window).height())) {
                                placement = 'bottom';
                            } else if ((tpr.left + actualWidth) < ($(window).scrollLeft() + $(window).width())) {
                                placement = 'right';
                            } else if (tpl.left > $(window).scrollLeft()) {
                                placement = 'left';
                            } else {
                                placement = 'right';
                            }
                        }
                        break;
                    case 'left':
                        if (tpl.left < $(window).scrollLeft()) {
                            if ((tpr.left + actualWidth) < ($(window).scrollLeft() + $(window).width())) {
                                placement = 'right';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'top';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'bottom';
                            } else {
                                placement = 'right';
                            }
                        }
                        break;
                    case 'right':
                        if ((tpr.left + actualWidth) > ($(window).scrollLeft() + $(window).width())) {
                            if (tpl.left > $(window).scrollLeft()) {
                                placement = 'left';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'top';
                            } else if (tpt.top > $(window).scrollTop()) {
                                placement = 'bottom';
                            }
                        }
                        break;
                }

                switch (placement) {
                    case 'bottom':
                        tp = tpb;
                        break;
                    case 'top':
                        tp = tpt;
                        break;
                    case 'left':
                        tp = tpl;
                        break;
                    case 'right':
                        tp = tpr;
                        break;
                }

                $tip
                .offset(tp)
                .addClass(placement)
                .addClass('in');
           */
                     
           
            var $tip = this.tip();
            
            var placement = typeof this.options.placement == 'function' ?
                this.options.placement.call(this, $tip[0], this.$element[0]) :
                this.options.placement;            

            var autoToken = /\s?auto?\s?/i;
            var autoPlace = autoToken.test(placement);
            if (autoPlace) {
                placement = placement.replace(autoToken, '') || 'top';
            }
            
            
            var pos = this.getPosition();
            var actualWidth = $tip[0].offsetWidth;
            var actualHeight = $tip[0].offsetHeight;

            if (autoPlace) {
                var $parent = this.$element.parent();

                var orgPlacement = placement;
                var docScroll    = document.documentElement.scrollTop || document.body.scrollTop;
                var parentWidth  = this.options.container == 'body' ? window.innerWidth  : $parent.outerWidth();
                var parentHeight = this.options.container == 'body' ? window.innerHeight : $parent.outerHeight();
                var parentLeft   = this.options.container == 'body' ? 0 : $parent.offset().left;

                placement = placement == 'bottom' && pos.top   + pos.height  + actualHeight - docScroll > parentHeight  ? 'top'    :
                            placement == 'top'    && pos.top   - docScroll   - actualHeight < 0                         ? 'bottom' :
                            placement == 'right'  && pos.right + actualWidth > parentWidth                              ? 'left'   :
                            placement == 'left'   && pos.left  - actualWidth < parentLeft                               ? 'right'  :
                            placement;

                $tip
                  .removeClass(orgPlacement)
                  .addClass(placement);
            }


            var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

            this.applyPlacement(calculatedOffset, placement);            
                     
                
            }).call(this.container());
          /*jshint laxcomma: false, eqeqeq: true*/  
        }            
    });

}(window.jQuery));

/* =========================================================
 * bootstrap-datepicker.js
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

(function( $ ) {

	function UTCDate(){
		return new Date(Date.UTC.apply(Date, arguments));
	}
	function UTCToday(){
		var today = new Date();
		return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	}

	// Picker object

	var Datepicker = function(element, options) {
		var that = this;

		this._process_options(options);

		this.element = $(element);
		this.isInline = false;
		this.isInput = this.element.is('input');
		this.component = this.element.is('.date') ? this.element.find('.add-on, .btn') : false;
		this.hasInput = this.component && this.element.find('input').length;
		if(this.component && this.component.length === 0)
			this.component = false;

		this.picker = $(DPGlobal.template);
		this._buildEvents();
		this._attachEvents();

		if(this.isInline) {
			this.picker.addClass('datepicker-inline').appendTo(this.element);
		} else {
			this.picker.addClass('datepicker-dropdown dropdown-menu');
		}

		if (this.o.rtl){
			this.picker.addClass('datepicker-rtl');
			this.picker.find('.prev i, .next i')
						.toggleClass('icon-arrow-left icon-arrow-right');
		}


		this.viewMode = this.o.startView;

		if (this.o.calendarWeeks)
			this.picker.find('tfoot th.today')
						.attr('colspan', function(i, val){
							return parseInt(val) + 1;
						});

		this._allow_update = false;

		this.setStartDate(this.o.startDate);
		this.setEndDate(this.o.endDate);
		this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);

		this.fillDow();
		this.fillMonths();

		this._allow_update = true;

		this.update();
		this.showMode();

		if(this.isInline) {
			this.show();
		}
	};

	Datepicker.prototype = {
		constructor: Datepicker,

		_process_options: function(opts){
			// Store raw options for reference
			this._o = $.extend({}, this._o, opts);
			// Processed options
			var o = this.o = $.extend({}, this._o);

			// Check if "de-DE" style date is available, if not language should
			// fallback to 2 letter code eg "de"
			var lang = o.language;
			if (!dates[lang]) {
				lang = lang.split('-')[0];
				if (!dates[lang])
					lang = defaults.language;
			}
			o.language = lang;

			switch(o.startView){
				case 2:
				case 'decade':
					o.startView = 2;
					break;
				case 1:
				case 'year':
					o.startView = 1;
					break;
				default:
					o.startView = 0;
			}

			switch (o.minViewMode) {
				case 1:
				case 'months':
					o.minViewMode = 1;
					break;
				case 2:
				case 'years':
					o.minViewMode = 2;
					break;
				default:
					o.minViewMode = 0;
			}

			o.startView = Math.max(o.startView, o.minViewMode);

			o.weekStart %= 7;
			o.weekEnd = ((o.weekStart + 6) % 7);

			var format = DPGlobal.parseFormat(o.format)
			if (o.startDate !== -Infinity) {
				o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
			}
			if (o.endDate !== Infinity) {
				o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
			}

			o.daysOfWeekDisabled = o.daysOfWeekDisabled||[];
			if (!$.isArray(o.daysOfWeekDisabled))
				o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
			o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function (d) {
				return parseInt(d, 10);
			});
		},
		_events: [],
		_secondaryEvents: [],
		_applyEvents: function(evs){
			for (var i=0, el, ev; i<evs.length; i++){
				el = evs[i][0];
				ev = evs[i][1];
				el.on(ev);
			}
		},
		_unapplyEvents: function(evs){
			for (var i=0, el, ev; i<evs.length; i++){
				el = evs[i][0];
				ev = evs[i][1];
				el.off(ev);
			}
		},
		_buildEvents: function(){
			if (this.isInput) { // single input
				this._events = [
					[this.element, {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}]
				];
			}
			else if (this.component && this.hasInput){ // component: input + button
				this._events = [
					// For components that are not readonly, allow keyboard nav
					[this.element.find('input'), {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}],
					[this.component, {
						click: $.proxy(this.show, this)
					}]
				];
			}
			else if (this.element.is('div')) {  // inline datepicker
				this.isInline = true;
			}
			else {
				this._events = [
					[this.element, {
						click: $.proxy(this.show, this)
					}]
				];
			}

			this._secondaryEvents = [
				[this.picker, {
					click: $.proxy(this.click, this)
				}],
				[$(window), {
					resize: $.proxy(this.place, this)
				}],
				[$(document), {
					mousedown: $.proxy(function (e) {
						// Clicked outside the datepicker, hide it
						if (!(
							this.element.is(e.target) ||
							this.element.find(e.target).size() ||
							this.picker.is(e.target) ||
							this.picker.find(e.target).size()
						)) {
							this.hide();
						}
					}, this)
				}]
			];
		},
		_attachEvents: function(){
			this._detachEvents();
			this._applyEvents(this._events);
		},
		_detachEvents: function(){
			this._unapplyEvents(this._events);
		},
		_attachSecondaryEvents: function(){
			this._detachSecondaryEvents();
			this._applyEvents(this._secondaryEvents);
		},
		_detachSecondaryEvents: function(){
			this._unapplyEvents(this._secondaryEvents);
		},
		_trigger: function(event, altdate){
			var date = altdate || this.date,
				local_date = new Date(date.getTime() + (date.getTimezoneOffset()*60000));

			this.element.trigger({
				type: event,
				date: local_date,
				format: $.proxy(function(altformat){
					var format = altformat || this.o.format;
					return DPGlobal.formatDate(date, format, this.o.language);
				}, this)
			});
		},

		show: function(e) {
			if (!this.isInline)
				this.picker.appendTo('body');
			this.picker.show();
			this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
			this.place();
			this._attachSecondaryEvents();
			if (e) {
				e.preventDefault();
			}
			this._trigger('show');
		},

		hide: function(e){
			if(this.isInline) return;
			if (!this.picker.is(':visible')) return;
			this.picker.hide().detach();
			this._detachSecondaryEvents();
			this.viewMode = this.o.startView;
			this.showMode();

			if (
				this.o.forceParse &&
				(
					this.isInput && this.element.val() ||
					this.hasInput && this.element.find('input').val()
				)
			)
				this.setValue();
			this._trigger('hide');
		},

		remove: function() {
			this.hide();
			this._detachEvents();
			this._detachSecondaryEvents();
			this.picker.remove();
			delete this.element.data().datepicker;
			if (!this.isInput) {
				delete this.element.data().date;
			}
		},

		getDate: function() {
			var d = this.getUTCDate();
			return new Date(d.getTime() + (d.getTimezoneOffset()*60000));
		},

		getUTCDate: function() {
			return this.date;
		},

		setDate: function(d) {
			this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset()*60000)));
		},

		setUTCDate: function(d) {
			this.date = d;
			this.setValue();
		},

		setValue: function() {
			var formatted = this.getFormattedDate();
			if (!this.isInput) {
				if (this.component){
					this.element.find('input').val(formatted);
				}
			} else {
				this.element.val(formatted);
			}
		},

		getFormattedDate: function(format) {
			if (format === undefined)
				format = this.o.format;
			return DPGlobal.formatDate(this.date, format, this.o.language);
		},

		setStartDate: function(startDate){
			this._process_options({startDate: startDate});
			this.update();
			this.updateNavArrows();
		},

		setEndDate: function(endDate){
			this._process_options({endDate: endDate});
			this.update();
			this.updateNavArrows();
		},

		setDaysOfWeekDisabled: function(daysOfWeekDisabled){
			this._process_options({daysOfWeekDisabled: daysOfWeekDisabled});
			this.update();
			this.updateNavArrows();
		},

		place: function(){
						if(this.isInline) return;
			var zIndex = parseInt(this.element.parents().filter(function() {
							return $(this).css('z-index') != 'auto';
						}).first().css('z-index'))+10;
			var offset = this.component ? this.component.parent().offset() : this.element.offset();
			var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(true);
			this.picker.css({
				top: offset.top + height,
				left: offset.left,
				zIndex: zIndex
			});
		},

		_allow_update: true,
		update: function(){
			if (!this._allow_update) return;

			var date, fromArgs = false;
			if(arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
				date = arguments[0];
				fromArgs = true;
			} else {
				date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
				delete this.element.data().date;
			}

			this.date = DPGlobal.parseDate(date, this.o.format, this.o.language);

			if(fromArgs) this.setValue();

			if (this.date < this.o.startDate) {
				this.viewDate = new Date(this.o.startDate);
			} else if (this.date > this.o.endDate) {
				this.viewDate = new Date(this.o.endDate);
			} else {
				this.viewDate = new Date(this.date);
			}
			this.fill();
		},

		fillDow: function(){
			var dowCnt = this.o.weekStart,
			html = '<tr>';
			if(this.o.calendarWeeks){
				var cell = '<th class="cw">&nbsp;</th>';
				html += cell;
				this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
			}
			while (dowCnt < this.o.weekStart + 7) {
				html += '<th class="dow">'+dates[this.o.language].daysMin[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			this.picker.find('.datepicker-days thead').append(html);
		},

		fillMonths: function(){
			var html = '',
			i = 0;
			while (i < 12) {
				html += '<span class="month">'+dates[this.o.language].monthsShort[i++]+'</span>';
			}
			this.picker.find('.datepicker-months td').html(html);
		},

		setRange: function(range){
			if (!range || !range.length)
				delete this.range;
			else
				this.range = $.map(range, function(d){ return d.valueOf(); });
			this.fill();
		},

		getClassNames: function(date){
			var cls = [],
				year = this.viewDate.getUTCFullYear(),
				month = this.viewDate.getUTCMonth(),
				currentDate = this.date.valueOf(),
				today = new Date();
			if (date.getUTCFullYear() < year || (date.getUTCFullYear() == year && date.getUTCMonth() < month)) {
				cls.push('old');
			} else if (date.getUTCFullYear() > year || (date.getUTCFullYear() == year && date.getUTCMonth() > month)) {
				cls.push('new');
			}
			// Compare internal UTC date with local today, not UTC today
			if (this.o.todayHighlight &&
				date.getUTCFullYear() == today.getFullYear() &&
				date.getUTCMonth() == today.getMonth() &&
				date.getUTCDate() == today.getDate()) {
				cls.push('today');
			}
			if (currentDate && date.valueOf() == currentDate) {
				cls.push('active');
			}
			if (date.valueOf() < this.o.startDate || date.valueOf() > this.o.endDate ||
				$.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1) {
				cls.push('disabled');
			}
			if (this.range){
				if (date > this.range[0] && date < this.range[this.range.length-1]){
					cls.push('range');
				}
				if ($.inArray(date.valueOf(), this.range) != -1){
					cls.push('selected');
				}
			}
			return cls;
		},

		fill: function() {
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
				startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
				endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
				endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
				currentDate = this.date && this.date.valueOf(),
				tooltip;
			this.picker.find('.datepicker-days thead th.datepicker-switch')
						.text(dates[this.o.language].months[month]+' '+year);
			this.picker.find('tfoot th.today')
						.text(dates[this.o.language].today)
						.toggle(this.o.todayBtn !== false);
			this.picker.find('tfoot th.clear')
						.text(dates[this.o.language].clear)
						.toggle(this.o.clearBtn !== false);
			this.updateNavArrows();
			this.fillMonths();
			var prevMonth = UTCDate(year, month-1, 28,0,0,0,0),
				day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7)%7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var clsName;
			while(prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getUTCDay() == this.o.weekStart) {
					html.push('<tr>');
					if(this.o.calendarWeeks){
						// ISO 8601: First week contains first thursday.
						// ISO also states week starts on Monday, but we can be more abstract here.
						var
							// Start of current week: based on weekstart/current date
							ws = new Date(+prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
							// Thursday of this week
							th = new Date(+ws + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
							// First Thursday of year, year from thursday
							yth = new Date(+(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay())%7*864e5),
							// Calendar week: ms between thursdays, div ms per day, div 7 days
							calWeek =  (th - yth) / 864e5 / 7 + 1;
						html.push('<td class="cw">'+ calWeek +'</td>');

					}
				}
				clsName = this.getClassNames(prevMonth);
				clsName.push('day');

				var before = this.o.beforeShowDay(prevMonth);
				if (before === undefined)
					before = {};
				else if (typeof(before) === 'boolean')
					before = {enabled: before};
				else if (typeof(before) === 'string')
					before = {classes: before};
				if (before.enabled === false)
					clsName.push('disabled');
				if (before.classes)
					clsName = clsName.concat(before.classes.split(/\s+/));
				if (before.tooltip)
					tooltip = before.tooltip;

				clsName = $.unique(clsName);
				html.push('<td class="'+clsName.join(' ')+'"' + (tooltip ? ' title="'+tooltip+'"' : '') + '>'+prevMonth.getUTCDate() + '</td>');
				if (prevMonth.getUTCDay() == this.o.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate()+1);
			}
			this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
			var currentYear = this.date && this.date.getUTCFullYear();

			var months = this.picker.find('.datepicker-months')
						.find('th:eq(1)')
							.text(year)
							.end()
						.find('span').removeClass('active');
			if (currentYear && currentYear == year) {
				months.eq(this.date.getUTCMonth()).addClass('active');
			}
			if (year < startYear || year > endYear) {
				months.addClass('disabled');
			}
			if (year == startYear) {
				months.slice(0, startMonth).addClass('disabled');
			}
			if (year == endYear) {
				months.slice(endMonth+1).addClass('disabled');
			}

			html = '';
			year = parseInt(year/10, 10) * 10;
			var yearCont = this.picker.find('.datepicker-years')
								.find('th:eq(1)')
									.text(year + '-' + (year + 9))
									.end()
								.find('td');
			year -= 1;
			for (var i = -1; i < 11; i++) {
				html += '<span class="year'+(i == -1 ? ' old' : i == 10 ? ' new' : '')+(currentYear == year ? ' active' : '')+(year < startYear || year > endYear ? ' disabled' : '')+'">'+year+'</span>';
				year += 1;
			}
			yearCont.html(html);
		},

		updateNavArrows: function() {
			if (!this._allow_update) return;

			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth();
			switch (this.viewMode) {
				case 0:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
				case 1:
				case 2:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
			}
		},

		click: function(e) {
			e.preventDefault();
			var target = $(e.target).closest('span, td, th');
			if (target.length == 1) {
				switch(target[0].nodeName.toLowerCase()) {
					case 'th':
						switch(target[0].className) {
							case 'datepicker-switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
								switch(this.viewMode){
									case 0:
										this.viewDate = this.moveMonth(this.viewDate, dir);
										break;
									case 1:
									case 2:
										this.viewDate = this.moveYear(this.viewDate, dir);
										break;
								}
								this.fill();
								break;
							case 'today':
								var date = new Date();
								date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

								this.showMode(-2);
								var which = this.o.todayBtn == 'linked' ? null : 'view';
								this._setDate(date, which);
								break;
							case 'clear':
								var element;
								if (this.isInput)
									element = this.element;
								else if (this.component)
									element = this.element.find('input');
								if (element)
									element.val("").change();
								this._trigger('changeDate');
								this.update();
								if (this.o.autoclose)
									this.hide();
								break;
						}
						break;
					case 'span':
						if (!target.is('.disabled')) {
							this.viewDate.setUTCDate(1);
							if (target.is('.month')) {
								var day = 1;
								var month = target.parent().find('span').index(target);
								var year = this.viewDate.getUTCFullYear();
								this.viewDate.setUTCMonth(month);
								this._trigger('changeMonth', this.viewDate);
								if (this.o.minViewMode === 1) {
									this._setDate(UTCDate(year, month, day,0,0,0,0));
								}
							} else {
								var year = parseInt(target.text(), 10)||0;
								var day = 1;
								var month = 0;
								this.viewDate.setUTCFullYear(year);
								this._trigger('changeYear', this.viewDate);
								if (this.o.minViewMode === 2) {
									this._setDate(UTCDate(year, month, day,0,0,0,0));
								}
							}
							this.showMode(-1);
							this.fill();
						}
						break;
					case 'td':
						if (target.is('.day') && !target.is('.disabled')){
							var day = parseInt(target.text(), 10)||1;
							var year = this.viewDate.getUTCFullYear(),
								month = this.viewDate.getUTCMonth();
							if (target.is('.old')) {
								if (month === 0) {
									month = 11;
									year -= 1;
								} else {
									month -= 1;
								}
							} else if (target.is('.new')) {
								if (month == 11) {
									month = 0;
									year += 1;
								} else {
									month += 1;
								}
							}
							this._setDate(UTCDate(year, month, day,0,0,0,0));
						}
						break;
				}
			}
		},

		_setDate: function(date, which){
			if (!which || which == 'date')
				this.date = new Date(date);
			if (!which || which  == 'view')
				this.viewDate = new Date(date);
			this.fill();
			this.setValue();
			this._trigger('changeDate');
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component){
				element = this.element.find('input');
			}
			if (element) {
				element.change();
				if (this.o.autoclose && (!which || which == 'date')) {
					this.hide();
				}
			}
		},

		moveMonth: function(date, dir){
			if (!dir) return date;
			var new_date = new Date(date.valueOf()),
				day = new_date.getUTCDate(),
				month = new_date.getUTCMonth(),
				mag = Math.abs(dir),
				new_month, test;
			dir = dir > 0 ? 1 : -1;
			if (mag == 1){
				test = dir == -1
					// If going back one month, make sure month is not current month
					// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
					? function(){ return new_date.getUTCMonth() == month; }
					// If going forward one month, make sure month is as expected
					// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
					: function(){ return new_date.getUTCMonth() != new_month; };
				new_month = month + dir;
				new_date.setUTCMonth(new_month);
				// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
				if (new_month < 0 || new_month > 11)
					new_month = (new_month + 12) % 12;
			} else {
				// For magnitudes >1, move one month at a time...
				for (var i=0; i<mag; i++)
					// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
					new_date = this.moveMonth(new_date, dir);
				// ...then reset the day, keeping it in the new month
				new_month = new_date.getUTCMonth();
				new_date.setUTCDate(day);
				test = function(){ return new_month != new_date.getUTCMonth(); };
			}
			// Common date-resetting loop -- if date is beyond end of month, make it
			// end of month
			while (test()){
				new_date.setUTCDate(--day);
				new_date.setUTCMonth(new_month);
			}
			return new_date;
		},

		moveYear: function(date, dir){
			return this.moveMonth(date, dir*12);
		},

		dateWithinRange: function(date){
			return date >= this.o.startDate && date <= this.o.endDate;
		},

		keydown: function(e){
			if (this.picker.is(':not(:visible)')){
				if (e.keyCode == 27) // allow escape to hide and re-show picker
					this.show();
				return;
			}
			var dateChanged = false,
				dir, day, month,
				newDate, newViewDate;
			switch(e.keyCode){
				case 27: // escape
					this.hide();
					e.preventDefault();
					break;
				case 37: // left
				case 39: // right
					if (!this.o.keyboardNavigation) break;
					dir = e.keyCode == 37 ? -1 : 1;
					if (e.ctrlKey){
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (e.shiftKey){
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else {
						newDate = new Date(this.date);
						newDate.setUTCDate(this.date.getUTCDate() + dir);
						newViewDate = new Date(this.viewDate);
						newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
					}
					if (this.dateWithinRange(newDate)){
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 38: // up
				case 40: // down
					if (!this.o.keyboardNavigation) break;
					dir = e.keyCode == 38 ? -1 : 1;
					if (e.ctrlKey){
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (e.shiftKey){
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else {
						newDate = new Date(this.date);
						newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
						newViewDate = new Date(this.viewDate);
						newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
					}
					if (this.dateWithinRange(newDate)){
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 13: // enter
					this.hide();
					e.preventDefault();
					break;
				case 9: // tab
					this.hide();
					break;
			}
			if (dateChanged){
				this._trigger('changeDate');
				var element;
				if (this.isInput) {
					element = this.element;
				} else if (this.component){
					element = this.element.find('input');
				}
				if (element) {
					element.change();
				}
			}
		},

		showMode: function(dir) {
			if (dir) {
				this.viewMode = Math.max(this.o.minViewMode, Math.min(2, this.viewMode + dir));
			}
			/*
				vitalets: fixing bug of very special conditions:
				jquery 1.7.1 + webkit + show inline datepicker in bootstrap popover.
				Method show() does not set display css correctly and datepicker is not shown.
				Changed to .css('display', 'block') solve the problem.
				See https://github.com/vitalets/x-editable/issues/37

				In jquery 1.7.2+ everything works fine.
			*/
			//this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
			this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
			this.updateNavArrows();
		}
	};

	var DateRangePicker = function(element, options){
		this.element = $(element);
		this.inputs = $.map(options.inputs, function(i){ return i.jquery ? i[0] : i; });
		delete options.inputs;

		$(this.inputs)
			.datepicker(options)
			.bind('changeDate', $.proxy(this.dateUpdated, this));

		this.pickers = $.map(this.inputs, function(i){ return $(i).data('datepicker'); });
		this.updateDates();
	};
	DateRangePicker.prototype = {
		updateDates: function(){
			this.dates = $.map(this.pickers, function(i){ return i.date; });
			this.updateRanges();
		},
		updateRanges: function(){
			var range = $.map(this.dates, function(d){ return d.valueOf(); });
			$.each(this.pickers, function(i, p){
				p.setRange(range);
			});
		},
		dateUpdated: function(e){
			var dp = $(e.target).data('datepicker'),
				new_date = dp.getUTCDate(),
				i = $.inArray(e.target, this.inputs),
				l = this.inputs.length;
			if (i == -1) return;

			if (new_date < this.dates[i]){
				// Date being moved earlier/left
				while (i>=0 && new_date < this.dates[i]){
					this.pickers[i--].setUTCDate(new_date);
				}
			}
			else if (new_date > this.dates[i]){
				// Date being moved later/right
				while (i<l && new_date > this.dates[i]){
					this.pickers[i++].setUTCDate(new_date);
				}
			}
			this.updateDates();
		},
		remove: function(){
			$.map(this.pickers, function(p){ p.remove(); });
			delete this.element.data().datepicker;
		}
	};

	function opts_from_el(el, prefix){
		// Derive options from element data-attrs
		var data = $(el).data(),
			out = {}, inkey,
			replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])'),
			prefix = new RegExp('^' + prefix.toLowerCase());
		for (var key in data)
			if (prefix.test(key)){
				inkey = key.replace(replace, function(_,a){ return a.toLowerCase(); });
				out[inkey] = data[key];
			}
		return out;
	}

	function opts_from_locale(lang){
		// Derive options from locale plugins
		var out = {};
		// Check if "de-DE" style date is available, if not language should
		// fallback to 2 letter code eg "de"
		if (!dates[lang]) {
			lang = lang.split('-')[0]
			if (!dates[lang])
				return;
		}
		var d = dates[lang];
		$.each(locale_opts, function(i,k){
			if (k in d)
				out[k] = d[k];
		});
		return out;
	}

	var old = $.fn.datepicker;
	var datepicker = $.fn.datepicker = function ( option ) {
		var args = Array.apply(null, arguments);
		args.shift();
		var internal_return,
			this_return;
		this.each(function () {
			var $this = $(this),
				data = $this.data('datepicker'),
				options = typeof option == 'object' && option;
			if (!data) {
				var elopts = opts_from_el(this, 'date'),
					// Preliminary otions
					xopts = $.extend({}, defaults, elopts, options),
					locopts = opts_from_locale(xopts.language),
					// Options priority: js args, data-attrs, locales, defaults
					opts = $.extend({}, defaults, locopts, elopts, options);
				if ($this.is('.input-daterange') || opts.inputs){
					var ropts = {
						inputs: opts.inputs || $this.find('input').toArray()
					};
					$this.data('datepicker', (data = new DateRangePicker(this, $.extend(opts, ropts))));
				}
				else{
					$this.data('datepicker', (data = new Datepicker(this, opts)));
				}
			}
			if (typeof option == 'string' && typeof data[option] == 'function') {
				internal_return = data[option].apply(data, args);
				if (internal_return !== undefined)
					return false;
			}
		});
		if (internal_return !== undefined)
			return internal_return;
		else
			return this;
	};

	var defaults = $.fn.datepicker.defaults = {
		autoclose: false,
		beforeShowDay: $.noop,
		calendarWeeks: false,
		clearBtn: false,
		daysOfWeekDisabled: [],
		endDate: Infinity,
		forceParse: true,
		format: 'mm/dd/yyyy',
		keyboardNavigation: true,
		language: 'en',
		minViewMode: 0,
		rtl: false,
		startDate: -Infinity,
		startView: 0,
		todayBtn: false,
		todayHighlight: false,
		weekStart: 0
	};
	var locale_opts = $.fn.datepicker.locale_opts = [
		'format',
		'rtl',
		'weekStart'
	];
	$.fn.datepicker.Constructor = Datepicker;
	var dates = $.fn.datepicker.dates = {
		en: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today",
			clear: "Clear"
		}
	};

	var DPGlobal = {
		modes: [
			{
				clsName: 'days',
				navFnc: 'Month',
				navStep: 1
			},
			{
				clsName: 'months',
				navFnc: 'FullYear',
				navStep: 1
			},
			{
				clsName: 'years',
				navFnc: 'FullYear',
				navStep: 10
		}],
		isLeapYear: function (year) {
			return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
		},
		getDaysInMonth: function (year, month) {
			return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
		nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
		parseFormat: function(format){
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts, '\0').split('\0'),
				parts = format.match(this.validParts);
			if (!separators || !separators.length || !parts || parts.length === 0){
				throw new Error("Invalid date format.");
			}
			return {separators: separators, parts: parts};
		},
		parseDate: function(date, format, language) {
			if (date instanceof Date) return date;
			if (typeof format === 'string')
				format = DPGlobal.parseFormat(format);
			if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
				var part_re = /([\-+]\d+)([dmwy])/,
					parts = date.match(/([\-+]\d+)([dmwy])/g),
					part, dir;
				date = new Date();
				for (var i=0; i<parts.length; i++) {
					part = part_re.exec(parts[i]);
					dir = parseInt(part[1]);
					switch(part[2]){
						case 'd':
							date.setUTCDate(date.getUTCDate() + dir);
							break;
						case 'm':
							date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
							break;
						case 'w':
							date.setUTCDate(date.getUTCDate() + dir * 7);
							break;
						case 'y':
							date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
							break;
					}
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
			}
			var parts = date && date.match(this.nonpunctuation) || [],
				date = new Date(),
				parsed = {},
				setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
				setters_map = {
					yyyy: function(d,v){ return d.setUTCFullYear(v); },
					yy: function(d,v){ return d.setUTCFullYear(2000+v); },
					m: function(d,v){
						v -= 1;
						while (v<0) v += 12;
						v %= 12;
						d.setUTCMonth(v);
						while (d.getUTCMonth() != v)
							d.setUTCDate(d.getUTCDate()-1);
						return d;
					},
					d: function(d,v){ return d.setUTCDate(v); }
				},
				val, filtered, part;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
			var fparts = format.parts.slice();
			// Remove noop parts
			if (parts.length != fparts.length) {
				fparts = $(fparts).filter(function(i,p){
					return $.inArray(p, setters_order) !== -1;
				}).toArray();
			}
			// Process remainder
			if (parts.length == fparts.length) {
				for (var i=0, cnt = fparts.length; i < cnt; i++) {
					val = parseInt(parts[i], 10);
					part = fparts[i];
					if (isNaN(val)) {
						switch(part) {
							case 'MM':
								filtered = $(dates[language].months).filter(function(){
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(function(){
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
						}
					}
					parsed[part] = val;
				}
				for (var i=0, s; i<setters_order.length; i++){
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s]))
						setters_map[s](date, parsed[s]);
				}
			}
			return date;
		},
		formatDate: function(date, format, language){
			if (typeof format === 'string')
				format = DPGlobal.parseFormat(format);
			var val = {
				d: date.getUTCDate(),
				D: dates[language].daysShort[date.getUTCDay()],
				DD: dates[language].days[date.getUTCDay()],
				m: date.getUTCMonth() + 1,
				M: dates[language].monthsShort[date.getUTCMonth()],
				MM: dates[language].months[date.getUTCMonth()],
				yy: date.getUTCFullYear().toString().substring(2),
				yyyy: date.getUTCFullYear()
			};
			val.dd = (val.d < 10 ? '0' : '') + val.d;
			val.mm = (val.m < 10 ? '0' : '') + val.m;
			var date = [],
				seps = $.extend([], format.separators);
			for (var i=0, cnt = format.parts.length; i <= cnt; i++) {
				if (seps.length)
					date.push(seps.shift());
				date.push(val[format.parts[i]]);
			}
			return date.join('');
		},
		headTemplate: '<thead>'+
							'<tr>'+
								'<th class="prev"><i class="icon-arrow-left"/></th>'+
								'<th colspan="5" class="datepicker-switch"></th>'+
								'<th class="next"><i class="icon-arrow-right"/></th>'+
							'</tr>'+
						'</thead>',
		contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
		footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr><tr><th colspan="7" class="clear"></th></tr></tfoot>'
	};
	DPGlobal.template = '<div class="datepicker">'+
							'<div class="datepicker-days">'+
								'<table class=" table-condensed">'+
									DPGlobal.headTemplate+
									'<tbody></tbody>'+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-months">'+
								'<table class="table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-years">'+
								'<table class="table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
						'</div>';

	$.fn.datepicker.DPGlobal = DPGlobal;


	/* DATEPICKER NO CONFLICT
	* =================== */

	$.fn.datepicker.noConflict = function(){
		$.fn.datepicker = old;
		return this;
	};


	/* DATEPICKER DATA-API
	* ================== */

	$(document).on(
		'focus.datepicker.data-api click.datepicker.data-api',
		'[data-provide="datepicker"]',
		function(e){
			var $this = $(this);
			if ($this.data('datepicker')) return;
			e.preventDefault();
			// component click requires us to explicitly show it
			datepicker.call($this, 'show');
		}
	);
	$(function(){
		//$('[data-provide="datepicker-inline"]').datepicker();
        //vit: changed to support noConflict()
        datepicker.call($('[data-provide="datepicker-inline"]'));
	});

}( window.jQuery ));

/**
Bootstrap-datepicker.  
Description and examples: https://github.com/eternicode/bootstrap-datepicker.  
For **i18n** you should include js file from here: https://github.com/eternicode/bootstrap-datepicker/tree/master/js/locales
and set `language` option.  
Since 1.4.0 date has different appearance in **popup** and **inline** modes. 

@class date
@extends abstractinput
@final
@example
<a href="#" id="dob" data-type="date" data-pk="1" data-url="/post" data-title="Select date">15/05/1984</a>
<script>
$(function(){
    $('#dob').editable({
        format: 'yyyy-mm-dd',    
        viewformat: 'dd/mm/yyyy',    
        datepicker: {
                weekStart: 1
           }
        }
    });
});
</script>
**/
(function ($) {
    "use strict";
    
    //store bootstrap-datepicker as bdateicker to exclude conflict with jQuery UI one
    $.fn.bdatepicker = $.fn.datepicker.noConflict();
    if(!$.fn.datepicker) { //if there were no other datepickers, keep also original name
        $.fn.datepicker = $.fn.bdatepicker;    
    }    
    
    var Date = function (options) {
        this.init('date', options, Date.defaults);
        this.initPicker(options, Date.defaults);
    };

    $.fn.editableutils.inherit(Date, $.fn.editabletypes.abstractinput);    
    
    $.extend(Date.prototype, {
        initPicker: function(options, defaults) {
            //'format' is set directly from settings or data-* attributes

            //by default viewformat equals to format
            if(!this.options.viewformat) {
                this.options.viewformat = this.options.format;
            }
            
            //try parse datepicker config defined as json string in data-datepicker
            options.datepicker = $.fn.editableutils.tryParseJson(options.datepicker, true);
            
            //overriding datepicker config (as by default jQuery extend() is not recursive)
            //since 1.4 datepicker internally uses viewformat instead of format. Format is for submit only
            this.options.datepicker = $.extend({}, defaults.datepicker, options.datepicker, {
                format: this.options.viewformat
            });
            
            //language
            this.options.datepicker.language = this.options.datepicker.language || 'en'; 

            //store DPglobal
            this.dpg = $.fn.bdatepicker.DPGlobal; 

            //store parsed formats
            this.parsedFormat = this.dpg.parseFormat(this.options.format);
            this.parsedViewFormat = this.dpg.parseFormat(this.options.viewformat);            
        },
        
        render: function () {
            this.$input.bdatepicker(this.options.datepicker);
            
            //"clear" link
            if(this.options.clear) {
                this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    this.clear();
                }, this));
                
                this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));  
            }                
        },
        
        value2html: function(value, element) {
           var text = value ? this.dpg.formatDate(value, this.parsedViewFormat, this.options.datepicker.language) : '';
           Date.superclass.value2html.call(this, text, element); 
        },

        html2value: function(html) {
            return this.parseDate(html, this.parsedViewFormat);
        },   

        value2str: function(value) {
            return value ? this.dpg.formatDate(value, this.parsedFormat, this.options.datepicker.language) : '';
        }, 

        str2value: function(str) {
            return this.parseDate(str, this.parsedFormat);
        }, 

        value2submit: function(value) {
            return this.value2str(value);
        },                    

        value2input: function(value) {
            this.$input.bdatepicker('update', value);
        },

        input2value: function() { 
            return this.$input.data('datepicker').date;
        },       

        activate: function() {
        },

        clear:  function() {
            this.$input.data('datepicker').date = null;
            this.$input.find('.active').removeClass('active');
            if(!this.options.showbuttons) {
                this.$input.closest('form').submit(); 
            }
        },

        autosubmit: function() {
            this.$input.on('mouseup', '.day', function(e){
                if($(e.currentTarget).is('.old') || $(e.currentTarget).is('.new')) {
                    return;
                }
                var $form = $(this).closest('form');
                setTimeout(function() {
                    $form.submit();
                }, 200);
            });
           //changedate is not suitable as it triggered when showing datepicker. see #149
           /*
           this.$input.on('changeDate', function(e){
               var $form = $(this).closest('form');
               setTimeout(function() {
                   $form.submit();
               }, 200);
           });
           */
       },
       
       /*
        For incorrect date bootstrap-datepicker returns current date that is not suitable
        for datefield.
        This function returns null for incorrect date.  
       */
       parseDate: function(str, format) {
           var date = null, formattedBack;
           if(str) {
               date = this.dpg.parseDate(str, format, this.options.datepicker.language);
               if(typeof str === 'string') {
                   formattedBack = this.dpg.formatDate(date, format, this.options.datepicker.language);
                   if(str !== formattedBack) {
                       date = null;
                   }
               }
           }
           return date;
       }

    });

    Date.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <div></div>
        **/         
        tpl:'<div class="editable-date well"></div>',
        /**
        @property inputclass 
        @default null
        **/
        inputclass: null,
        /**
        Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
        Possible tokens are: <code>d, dd, m, mm, yy, yyyy</code>  

        @property format 
        @type string
        @default yyyy-mm-dd
        **/
        format:'yyyy-mm-dd',
        /**
        Format used for displaying date. Also applied when converting date from element's text on init.   
        If not specified equals to <code>format</code>

        @property viewformat 
        @type string
        @default null
        **/
        viewformat: null,
        /**
        Configuration of datepicker.
        Full list of options: http://bootstrap-datepicker.readthedocs.org/en/latest/options.html

        @property datepicker 
        @type object
        @default {
            weekStart: 0,
            startView: 0,
            minViewMode: 0,
            autoclose: false
        }
        **/
        datepicker:{
            weekStart: 0,
            startView: 0,
            minViewMode: 0,
            autoclose: false
        },
        /**
        Text shown as clear date button. 
        If <code>false</code> clear button will not be rendered.

        @property clear 
        @type boolean|string
        @default 'x clear'
        **/
        clear: '&times; clear'
    });

    $.fn.editabletypes.date = Date;

}(window.jQuery));

/**
Bootstrap datefield input - modification for inline mode.
Shows normal <input type="text"> and binds popup datepicker.  
Automatically shown in inline mode.

@class datefield
@extends date

@since 1.4.0
**/
(function ($) {
    "use strict";
    
    var DateField = function (options) {
        this.init('datefield', options, DateField.defaults);
        this.initPicker(options, DateField.defaults);
    };

    $.fn.editableutils.inherit(DateField, $.fn.editabletypes.date);    
    
    $.extend(DateField.prototype, {
        render: function () {
            this.$input = this.$tpl.find('input');
            this.setClass();
            this.setAttr('placeholder');
    
            //bootstrap-datepicker is set `bdateicker` to exclude conflict with jQuery UI one. (in date.js)        
            this.$tpl.bdatepicker(this.options.datepicker);
            
            //need to disable original event handlers
            this.$input.off('focus keydown');
            
            //update value of datepicker
            this.$input.keyup($.proxy(function(){
               this.$tpl.removeData('date');
               this.$tpl.bdatepicker('update');
            }, this));
            
        },   
        
       value2input: function(value) {
           this.$input.val(value ? this.dpg.formatDate(value, this.parsedViewFormat, this.options.datepicker.language) : '');
           this.$tpl.bdatepicker('update');
       },
        
       input2value: function() { 
           return this.html2value(this.$input.val());
       },              
        
       activate: function() {
           $.fn.editabletypes.text.prototype.activate.call(this);
       },
       
       autosubmit: function() {
         //reset autosubmit to empty  
       }
    });
    
    DateField.defaults = $.extend({}, $.fn.editabletypes.date.defaults, {
        /**
        @property tpl 
        **/         
        tpl:'<div class="input-append date"><input type="text"/><span class="add-on"><i class="icon-th"></i></span></div>',
        /**
        @property inputclass 
        @default 'input-small'
        **/         
        inputclass: 'input-small',
        
        /* datepicker config */
        datepicker: {
            weekStart: 0,
            startView: 0,
            minViewMode: 0,
            autoclose: true
        }
    });
    
    $.fn.editabletypes.datefield = DateField;

}(window.jQuery));
/**
Bootstrap-datetimepicker.  
Based on [smalot bootstrap-datetimepicker plugin](https://github.com/smalot/bootstrap-datetimepicker). 
Before usage you should manually include dependent js and css:

    <link href="css/datetimepicker.css" rel="stylesheet" type="text/css"></link> 
    <script src="js/bootstrap-datetimepicker.js"></script>

For **i18n** you should include js file from here: https://github.com/smalot/bootstrap-datetimepicker/tree/master/js/locales
and set `language` option.  

@class datetime
@extends abstractinput
@final
@since 1.4.4
@example
<a href="#" id="last_seen" data-type="datetime" data-pk="1" data-url="/post" title="Select date & time">15/03/2013 12:45</a>
<script>
$(function(){
    $('#last_seen').editable({
        format: 'yyyy-mm-dd hh:ii',    
        viewformat: 'dd/mm/yyyy hh:ii',    
        datetimepicker: {
                weekStart: 1
           }
        }
    });
});
</script>
**/
(function ($) {
    "use strict";

    var DateTime = function (options) {
        this.init('datetime', options, DateTime.defaults);
        this.initPicker(options, DateTime.defaults);
    };

    $.fn.editableutils.inherit(DateTime, $.fn.editabletypes.abstractinput);

    $.extend(DateTime.prototype, {
        initPicker: function(options, defaults) {
            //'format' is set directly from settings or data-* attributes

            //by default viewformat equals to format
            if(!this.options.viewformat) {
                this.options.viewformat = this.options.format;
            }
            
            //try parse datetimepicker config defined as json string in data-datetimepicker
            options.datetimepicker = $.fn.editableutils.tryParseJson(options.datetimepicker, true);

            //overriding datetimepicker config (as by default jQuery extend() is not recursive)
            //since 1.4 datetimepicker internally uses viewformat instead of format. Format is for submit only
            this.options.datetimepicker = $.extend({}, defaults.datetimepicker, options.datetimepicker, {
                format: this.options.viewformat
            });

            //language
            this.options.datetimepicker.language = this.options.datetimepicker.language || 'en'; 

            //store DPglobal
            this.dpg = $.fn.datetimepicker.DPGlobal; 

            //store parsed formats
            this.parsedFormat = this.dpg.parseFormat(this.options.format, this.options.formatType);
            this.parsedViewFormat = this.dpg.parseFormat(this.options.viewformat, this.options.formatType);
        },

        render: function () {
            this.$input.datetimepicker(this.options.datetimepicker);

            //adjust container position when viewMode changes
            //see https://github.com/smalot/bootstrap-datetimepicker/pull/80
            this.$input.on('changeMode', function(e) {
                var f = $(this).closest('form').parent();
                //timeout here, otherwise container changes position before form has new size
                setTimeout(function(){
                    f.triggerHandler('resize');
                }, 0);
            });

            //"clear" link
            if(this.options.clear) {
                this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    this.clear();
                }, this));

                this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));  
            }
        },

        value2html: function(value, element) {
            //formatDate works with UTCDate!
            var text = value ? this.dpg.formatDate(this.toUTC(value), this.parsedViewFormat, this.options.datetimepicker.language, this.options.formatType) : '';
            if(element) {
                DateTime.superclass.value2html.call(this, text, element);
            } else {
                return text;
            }
        },

        html2value: function(html) {
            //parseDate return utc date!
            var value = this.parseDate(html, this.parsedViewFormat); 
            return value ? this.fromUTC(value) : null;
        },

        value2str: function(value) {
            //formatDate works with UTCDate!
            return value ? this.dpg.formatDate(this.toUTC(value), this.parsedFormat, this.options.datetimepicker.language, this.options.formatType) : '';
       },

       str2value: function(str) {
           //parseDate return utc date!
           var value = this.parseDate(str, this.parsedFormat);
           return value ? this.fromUTC(value) : null;
       },

       value2submit: function(value) {
           return this.value2str(value);
       },

       value2input: function(value) {
           if(value) {
             this.$input.data('datetimepicker').setDate(value);
           }
       },

       input2value: function() { 
           //date may be cleared, in that case getDate() triggers error
           var dt = this.$input.data('datetimepicker');
           return dt.date ? dt.getDate() : null;
       },

       activate: function() {
       },

       clear: function() {
          this.$input.data('datetimepicker').date = null;
          this.$input.find('.active').removeClass('active');
          if(!this.options.showbuttons) {
             this.$input.closest('form').submit(); 
          }          
       },

       autosubmit: function() {
           this.$input.on('mouseup', '.minute', function(e){
               var $form = $(this).closest('form');
               setTimeout(function() {
                   $form.submit();
               }, 200);
           });
       },

       //convert date from local to utc
       toUTC: function(value) {
         return value ? new Date(value.valueOf() - value.getTimezoneOffset() * 60000) : value;  
       },

       //convert date from utc to local
       fromUTC: function(value) {
         return value ? new Date(value.valueOf() + value.getTimezoneOffset() * 60000) : value;  
       },

       /*
        For incorrect date bootstrap-datetimepicker returns current date that is not suitable
        for datetimefield.
        This function returns null for incorrect date.  
       */
       parseDate: function(str, format) {
           var date = null, formattedBack;
           if(str) {
               date = this.dpg.parseDate(str, format, this.options.datetimepicker.language, this.options.formatType);
               if(typeof str === 'string') {
                   formattedBack = this.dpg.formatDate(date, format, this.options.datetimepicker.language, this.options.formatType);
                   if(str !== formattedBack) {
                       date = null;
                   } 
               }
           }
           return date;
       }

    });

    DateTime.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <div></div>
        **/         
        tpl:'<div class="editable-date well"></div>',
        /**
        @property inputclass 
        @default null
        **/
        inputclass: null,
        /**
        Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
        Possible tokens are: <code>d, dd, m, mm, yy, yyyy, h, i</code>  
        
        @property format 
        @type string
        @default yyyy-mm-dd hh:ii
        **/         
        format:'yyyy-mm-dd hh:ii',
        formatType:'standard',
        /**
        Format used for displaying date. Also applied when converting date from element's text on init.   
        If not specified equals to <code>format</code>
        
        @property viewformat 
        @type string
        @default null
        **/
        viewformat: null,
        /**
        Configuration of datetimepicker.
        Full list of options: https://github.com/smalot/bootstrap-datetimepicker

        @property datetimepicker 
        @type object
        @default { }
        **/
        datetimepicker:{
            todayHighlight: false,
            autoclose: false
        },
        /**
        Text shown as clear date button. 
        If <code>false</code> clear button will not be rendered.

        @property clear 
        @type boolean|string
        @default 'x clear'
        **/
        clear: '&times; clear'
    });

    $.fn.editabletypes.datetime = DateTime;

}(window.jQuery));
/**
Bootstrap datetimefield input - datetime input for inline mode.
Shows normal <input type="text"> and binds popup datetimepicker.  
Automatically shown in inline mode.

@class datetimefield
@extends datetime

**/
(function ($) {
    "use strict";
    
    var DateTimeField = function (options) {
        this.init('datetimefield', options, DateTimeField.defaults);
        this.initPicker(options, DateTimeField.defaults);
    };

    $.fn.editableutils.inherit(DateTimeField, $.fn.editabletypes.datetime);
    
    $.extend(DateTimeField.prototype, {
        render: function () {
            this.$input = this.$tpl.find('input');
            this.setClass();
            this.setAttr('placeholder');
            
            this.$tpl.datetimepicker(this.options.datetimepicker);
            
            //need to disable original event handlers
            this.$input.off('focus keydown');
            
            //update value of datepicker
            this.$input.keyup($.proxy(function(){
               this.$tpl.removeData('date');
               this.$tpl.datetimepicker('update');
            }, this));
            
        },   
      
       value2input: function(value) {
           this.$input.val(this.value2html(value));
           this.$tpl.datetimepicker('update');
       },
        
       input2value: function() { 
           return this.html2value(this.$input.val());
       },              
        
       activate: function() {
           $.fn.editabletypes.text.prototype.activate.call(this);
       },
       
       autosubmit: function() {
         //reset autosubmit to empty  
       }
    });
    
    DateTimeField.defaults = $.extend({}, $.fn.editabletypes.datetime.defaults, {
        /**
        @property tpl 
        **/         
        tpl:'<div class="input-append date"><input type="text"/><span class="add-on"><i class="icon-th"></i></span></div>',
        /**
        @property inputclass 
        @default 'input-medium'
        **/         
        inputclass: 'input-medium',
        
        /* datetimepicker config */
        datetimepicker:{
            todayHighlight: false,
            autoclose: true
        }
    });
    
    $.fn.editabletypes.datetimefield = DateTimeField;

}(window.jQuery));