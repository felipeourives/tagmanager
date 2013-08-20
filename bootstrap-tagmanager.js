/* ===================================================
 * bootstrap-tagmanager.js v3.0.0
 * http://welldonethings.com/tags/manager
 * ===================================================
 * Copyright 2012 Max Favilli
 *
 * Licensed under the Mozilla Public License, Version 2.0 You may not use this work except in compliance with the License.
 *
 * http://www.mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

(function ($) {

  "use strict";

  if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    console.log = function () { };
  }

  $.fn.tagsManager = function (options, tagToManipulate) {
    var tagManagerOptions = {
      version_three: true,
      prefilled: null,
      CapitalizeFirstLetter: false,
      preventSubmitOnEnter: true, // deprecated
      isClearInputOnEsc: true, // deprecated
      typeahead: false,
      typeaheadAjaxMethod: "POST",
      typeaheadAjaxSource: null,
      typeaheadAjaxPolling: false,
      typeaheadOverrides: null,
      typeaheadDelegate: {},
      typeaheadSource: null,
      AjaxPush: null,
      AjaxPushAllTags: null,
      AjaxPushParameters: null,
      delimiters: [9, 13, 44], // tab, enter, comma
      backspace: [8],
      maxTags: 0,
      hiddenTagListName: null,
      hiddenTagListId: null,
      deleteTagsOnBackspace: true, // deprecated
      tagsContainer: null,
      tagCloseIcon: 'x',
      tagClass: '',
      validator: null,
      onlyTagList: false
    };

    // exit when no matched elements
    if (!(0 in this)) {
      return this;
    }

    $.extend(tagManagerOptions, options);

    var obj = this;
    var rndid = "";

    var albet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 5; i++)
      rndid += albet.charAt(Math.floor(Math.random() * albet.length));

    if (tagManagerOptions.hiddenTagListName === null) {
      tagManagerOptions.hiddenTagListName = "hidden-" + rndid;
    }

    var delimiters = tagManagerOptions.delimeters || tagManagerOptions.delimiters; // 'delimeter' is deprecated
    // delimiter values to be handled as key codes
    var keyNums = [9, 13, 17, 18, 19, 37, 38, 39, 40];
    var delimiterChars = [], delimiterKeys = [];
    $.each(delimiters, function (i, v) {
      if ($.inArray(v, keyNums) != -1) {
        delimiterKeys.push(v);
      } else {
        delimiterChars.push(v);
      }
    });
    var baseDelimiter = String.fromCharCode(delimiterChars[0] || 44);
    var backspace = tagManagerOptions.backspace;
    var tagBaseClass = 'tm-tag';
    var inputBaseClass = 'tm-input';

    if ($.isFunction(tagManagerOptions.validator)) obj.data('validator', tagManagerOptions.validator);


    //var ajaxPolling = function (query, process) {
    //  if (typeof (tagManagerOptions.typeaheadAjaxSource) == "string") {
    //    $.ajax({
    //      cache: false,
    //      type: "POST",
    //      contentType: "application/json",
    //      dataType: "json",
    //      url: tagManagerOptions.typeaheadAjaxSource,
    //      data: JSON.stringify({ typeahead: query }),
    //      success: function (data) { onTypeaheadAjaxSuccess(data, false, process); }
    //    });
    //  }
    //};


    var tagClasses = function () {
      // 1) default class (tm-tag)
      var cl = tagBaseClass;
      // 2) interpolate from input class: tm-input-xxx --> tm-tag-xxx
      if (obj.attr('class')) {
        $.each(obj.attr('class').split(' '), function (index, value) {
          if (value.indexOf(inputBaseClass + '-') != -1) {
            cl += ' ' + tagBaseClass + value.substring(inputBaseClass.length);
          }
        });
      }
      // 3) tags from tagClass option
      cl += (tagManagerOptions.tagClass ? ' ' + tagManagerOptions.tagClass : '');
      return cl;
    };

    var trimTag = function (tag) {
      tag = $.trim(tag);
      // truncate at the first delimiter char
      var i = 0;
      for (i; i < tag.length; i++) {
        if ($.inArray(tag.charCodeAt(i), delimiterChars) != -1) break;
      }
      return tag.substring(0, i);
    };

    var popTag = function () {
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      if (tlid.length > 0) {
        var tagId = tlid.pop();
        tlis.pop();
        // console.log("TagIdToRemove: " + tagId);
        $("#" + rndid + "_" + tagId).remove();
        refreshHiddenTagList();
        // console.log(tlis);
      }
    };

    var empty = function () {
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      while (tlid.length > 0) {
        var tagId = tlid.pop();
        tlis.pop();
        // console.log("TagIdToRemove: " + tagId);
        $("#" + rndid + "_" + tagId).remove();
        refreshHiddenTagList();
        // console.log(tlis);
      }
    };

    var refreshHiddenTagList = function () {
      var tlis = obj.data("tlis");
      var lhiddenTagList = obj.data("lhiddenTagList");

      obj.trigger('tags:refresh', tlis.join(baseDelimiter));

      if (lhiddenTagList) {
        $(lhiddenTagList).val(tlis.join(baseDelimiter)).change();
      }
    };

    var spliceTag = function (tagId) {
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      var p = $.inArray(tagId, tlid);

      // console.log("TagIdToRemove: " + tagId);
      // console.log("position: " + p);

      if (-1 != p) {
        $("#" + rndid + "_" + tagId).remove();
        tlis.splice(p, 1);
        tlid.splice(p, 1);
        refreshHiddenTagList();
        // console.log(tlis);
      }

      if (tagManagerOptions.maxTags > 0 && tlis.length < tagManagerOptions.maxTags) {
        obj.show();
      }
    };

    var pushAllTags = function (e, tagstring) {
      if (tagManagerOptions.AjaxPushAllTags) {
        $.post(tagManagerOptions.AjaxPushAllTags, { tags: tagstring });
      }
    };

    var pushTag = function (tag) {
      tag = trimTag(tag);

      if (!tag || tag.length <= 0) return;

      if (tagManagerOptions.CapitalizeFirstLetter && tag.length > 1) {
        tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
      }

      // call the validator (if any) and do not let the tag pass if invalid
      if (obj.data('validator') && !obj.data('validator')(tag)) return;

      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      // dont accept new tags beyond the defined maximum
      if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags) return;

      var alreadyInList = false;
      var tlisLowerCase = tlis.map(function (elem) { return elem.toLowerCase(); });
      var p = $.inArray(tag.toLowerCase(), tlisLowerCase);
      if (-1 != p) {
        // console.log("tag:" + tag + " !!already in list!!");
        alreadyInList = true;
      }

      if (alreadyInList) {
        var pTagId = tlid[p];
        $("#" + rndid + "_" + pTagId).stop()
          .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
          .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100)
          .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
          .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100)
          .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
          .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100);
      } else {
        var max = Math.max.apply(null, tlid);
        max = max == -Infinity ? 0 : max;

        var tagId = ++max;
        tlis.push(tag);
        tlid.push(tagId);

        if (tagManagerOptions.AjaxPush != null) {
          $.post(tagManagerOptions.AjaxPush, $.extend({ tag: tag }, tagManagerOptions.AjaxPushParameters));
        }

        // console.log("tagList: " + tlis);

        var newTagId = rndid + '_' + tagId;
        var newTagRemoveId = rndid + '_Remover_' + tagId;
        var escaped = $("<span></span>").text(tag).html();

        var html = '<span class="' + tagClasses() + '" id="' + newTagId + '">';
        html += '<span>' + escaped + '</span>';
        html += '<a href="#" class="tm-tag-remove" id="' + newTagRemoveId + '" TagIdToRemove="' + tagId + '">';
        html += tagManagerOptions.tagCloseIcon + '</a></span> ';
        var $el = $(html);

        if (tagManagerOptions.tagsContainer != null) {
          $(tagManagerOptions.tagsContainer).append($el);
        } else {
          obj.before($el);
        }

        $el.find("#" + newTagRemoveId).on("click", obj, function (e) {
          e.preventDefault();
          var TagIdToRemove = parseInt($(this).attr("TagIdToRemove"));
          spliceTag(TagIdToRemove, e.data);
        });

        refreshHiddenTagList();

        if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags) {
          obj.hide();
        }
      }
      obj.val("");
    };

    var prefill = function (pta) {
      $.each(pta, function (key, val) {
        pushTag(val);
      });
    };

    var killEvent = function (e) {
      e.cancelBubble = true;
      e.returnValue = false;
      e.stopPropagation();
      e.preventDefault();
    };

    var keyInArray = function (e, ary) {
      return $.inArray(e.which, ary) != -1
    };

    var applyDelimiter = function (e) {
      pushTag(obj.val());
      e.preventDefault();
    };

    var returnValue = null;
    this.each(function () {

      if (typeof options == 'string') {
        switch (options) {
          case "empty":
            empty();
            break;
          case "popTag":
            popTag();
            break;
          case "pushTag":
            pushTag(tagToManipulate);
            break;
          case "tags":
            returnValue = { tags: obj.data("tlis") };
            break;
        }
        return;
      }

      // prevent double-initialization of TagManager
      if ($(this).data('tagManager')) { return false; }
      $(this).data('tagManager', true);

      // store instance-specific data in the DOM object
      var tlis = new Array();
      var tlid = new Array();
      obj.data("tlis", tlis); //list of string tags
      obj.data("tlid", tlid); //list of ID of the string tags

      if (tagManagerOptions.hiddenTagListId == null) { /* if hidden input not given default activity */
        var hiddenTag = $("input[name='" + tagManagerOptions.hiddenTagListName + "']");
        if (hiddenTag.length > 0) {
          hiddenTag.remove();
        }

        var html = "";
        html += "<input name='" + tagManagerOptions.hiddenTagListName + "' type='hidden' value=''/>";
        obj.after(html);
        obj.data("lhiddenTagList",
          obj.siblings("input[name='" + tagManagerOptions.hiddenTagListName + "']")[0]
        );
      } else {
        obj.data("lhiddenTagList", $('#' + tagManagerOptions.hiddenTagListId))
      }

      if (tagManagerOptions.AjaxPushAllTags) {
        obj.on('tags:refresh', pushAllTags);
      }

      // hide popovers on focus and keypress events
      obj.on('focus keypress', function (e) {
        if ($(this).popover) {
          $(this).popover('hide');
        }
      });

      // handle ESC (keyup used for browser compatibility)
      if (tagManagerOptions.isClearInputOnEsc) {
        obj.on('keyup', function (e) {
          if (e.which == 27) {
            // console.log('esc detected');
            $(this).val('');
            killEvent(e);
          }
        });
      }

      obj.on('keypress', function (e) {
        // push ASCII-based delimiters
        if (keyInArray(e, delimiterChars)) {
          applyDelimiter(e);
        }
      });

      obj.on('keydown', function (e) {
        // disable ENTER
        if (e.which == 13) {
          if (tagManagerOptions.preventSubmitOnEnter) {
            killEvent(e);
          }
        }

        // push key-based delimiters (includes <enter> by default)
        if (keyInArray(e, delimiterKeys)) {
          applyDelimiter(e);
        }
      });

      // BACKSPACE (keydown used for browser compatibility)
      if (tagManagerOptions.deleteTagsOnBackspace) {
        obj.on('keydown', function (e) {
          if (keyInArray(e, backspace)) {
            // console.log("backspace detected");
            if ($(this).val().length <= 0) {
              popTag();
              killEvent(e);
            }
          }
        });
      }

      obj.change(function (e) {

        if (!/webkit/.test(navigator.userAgent.toLowerCase())) { $(this).focus(); } // why?

        /* unimplemented mode to push tag on blur
         else if (tagManagerOptions.pushTagOnBlur) {
         console.log('change: pushTagOnBlur ' + tag);
         pushTag($(this).val());
         } */
        killEvent(e);
      });

      if (tagManagerOptions.prefilled != null) {
        if (typeof (tagManagerOptions.prefilled) == "object") {
          prefill(tagManagerOptions.prefilled);
        } else if (typeof (tagManagerOptions.prefilled) == "string") {
          prefill(tagManagerOptions.prefilled.split(baseDelimiter));
        } else if (typeof (tagManagerOptions.prefilled) == "function") {
          prefill(tagManagerOptions.prefilled());
        }
      } else if (tagManagerOptions.hiddenTagListId != null) {
        prefill($('#' + tagManagerOptions.hiddenTagListId).val().split(baseDelimiter));
      }
    });

    if (!returnValue)
      returnValue = this;

    return returnValue;
  }
})(jQuery);