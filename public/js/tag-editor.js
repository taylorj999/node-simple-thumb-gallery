window.globalTagEditorRemoveButtonWidth = 15;
window.globalTagEditorDelimiters = [];

function setCursorToEnd(ele) {
    var selectRange = document.createRange(),
    sel = window.getSelection();
    
    ele.focus();
    selectRange.selectNodeContents(ele.get(0).childNodes[0]);
    selectRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(selectRange);
}

function refreshTagList(editor) {
	var tagList = $(editor).find(".tag-data");
	var formattedTags = "";
	for (var x=0;x<tagList.length;x++) {
		const tagText = $(tagList[x]).text().trim();
		const finalTagText = tagText.replace(/[\/\'\"\[\{\]\}<>,]+/g,''); // basic sanitization
		$(tagList[x]).text(finalTagText);
		if (x>0) formattedTags += ',';
		formattedTags += '"' + finalTagText + '"';
	}
	formattedTags = "[" + formattedTags + "]";
	$("#"+$(editor).data("field-id")).val(formattedTags);
}

function checkIfRemoveButtonClicked(ev) {
	const distFromEnd = ev.target.offsetWidth - ev.offsetX;
	if (distFromEnd <= window.globalTagEditorRemoveButtonWidth) {
		ev.stopPropagation();
		$(this).removeClass("tag-data");
		refreshTagList($(this).parent().parent().parent());
		$(this).parent().remove();
	}		
}

function keydownInputElement(ev) {
	const self=this;
	
	if (window.globalTagEditorDelimiters.includes(ev.code)) {
		ev.stopPropagation();
		$(ev.target).blur();
	}
}

function blurInputElement() {
	if ($(this).text().trim().length == 0) {
		$(this).parent().remove();
	} else {
		$(this).parent().removeClass("tag-new");
		$(this).removeClass("tag-input");
		$(this).addClass("tag-data");
		$(this).prop("tabindex","-1");
		$(this).prop("contenteditable", false);
		$(this).off("blur");
		$(this).on("mouseup", checkIfRemoveButtonClicked);
		refreshTagList($(this).parent().parent().parent());
	}
}

function createNewInputElement(editor) {
	var outerSpan = $('<span class="tag tag-new">');
	var innerSpan = $('<span class="tag-input">');
	$(innerSpan).prop("contenteditable",true);
	$(innerSpan).prop("spellcheck",false);
	$(innerSpan).prop("tabindex","0");
	$(innerSpan).text(' '); // the inner span must have a text value in order for setCursorToEnd to work
	$(outerSpan).append(innerSpan);
	$(editor).find('.tags').append(outerSpan);
	setCursorToEnd(innerSpan);
	$(innerSpan).on("blur", blurInputElement);
	$(innerSpan).on("keydown", keydownInputElement);
}

function setupTagEditor(params) {
	$(".tag-editor").each(function(index) {
		$(this).on("mouseup", function(ev) {
			if (($(ev.target).hasClass("tag") && $(ev.target).find(".tag-data").length > 0) ||
					$(ev.target).hasClass("tag-data")) {
					// if you wanted to trigger some functionality like opening the tag back up for editing, you could do it here
					// you will be here if a data element was clicked but not on the remove button
					console.log("editor click in data elem");
				} else if (!$(ev.target).hasClass("tag-input")) {
					createNewInputElement(this);
		        }
			});
		refreshTagList(this);
	});
	
	$(".tag-data").on("mouseup", checkIfRemoveButtonClicked); // bind the remove button detection to starting data elements
	
	try {
		if (Array.isArray(params.delimiters)) {
			window.globalTagEditorDelimiters = params.delimiters;
		}
	} catch (error) {
		console.error(error);
	}
}