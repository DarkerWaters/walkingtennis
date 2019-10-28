/*
	Drift by Pixelarity
	pixelarity.com @pixelarity
	License: pixelarity.com/license
*/

(function($) {

	skel.init({
		reset: 'full',
		breakpoints: {
			global: { href: 'css/style.css', containers: 1400, grid: { gutters: ['2em', 0] } },
			xlarge: { media: '(max-width: 1680px)', href: 'css/style-xlarge.css', containers: 1200 },
			large: { media: '(max-width: 1280px)', href: 'css/style-large.css', containers: 960, grid: { gutters: ['1.5em', 0] }, viewport: { scalable: false } },
			medium: { media: '(max-width: 980px)', href: 'css/style-medium.css', containers: '90%', grid: { zoom: 2 } },
			small: { media: '(max-width: 736px)', href: 'css/style-small.css', containers: '90%!', grid: { gutters: ['1.25em', 0], zoom: 3 } },
			xsmall: { media: '(max-width: 480px)', href: 'css/style-xsmall.css' }
		},
		plugins: {
			layers: {
				
				// Config.
					config: {
						transformTest: function() { return skel.vars.isMobile; }
					},
				
				// Navigation Button.
					navButton: {
						breakpoints: 'medium',
						height: '4em',
						html: '<span class="toggle" data-action="toggleLayer" data-args="navPanel"></span>',
						position: 'top-left',
						side: 'top',
						width: '6em'
					},

				// Navigation Panel.
					navPanel: {
						animation: 'overlayX',
						breakpoints: 'medium',
						clickToHide: true,
						height: '100%',
						hidden: true,
						html: '<div class="nav_menu_buttons" data-action="navList" data-args="nav"></div>',
						orientation: 'vertical',
						position: 'top-left',
						side: 'left',
						width: 250
					}

			}
		}
	});

	function initialiseLoadedPage() {
		// setup all the stuff on the loaded page
		var $window = $(window),
			$body = $('body'),
			$banner = $('#banner'),
			$header = $('#header');

		console.log('initialiseing loaded page');

		// setup the firebase login button
		initialiseFirebaseLoginButton();

		// Disable animations/transitions until the page has loaded.
		$body.addClass('is-loading');
		
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-loading');
			}, 500);
		});

		// Forms (IE<10).
		var $form = $('form');
		if ($form.length > 0) {
			$form.find('.form-button-submit')
				.on('click', function() {
					$(this).parents('form').submit();
					return false;
				});
			if (skel.vars.IEVersion < 10) {
				$.fn.n33_formerize=function(){var _fakes=new Array(),_form = $(this);_form.find('input[type=text],textarea').each(function() { var e = $(this); if (e.val() == '' || e.val() == e.attr('placeholder')) { e.addClass('formerize-placeholder'); e.val(e.attr('placeholder')); } }).blur(function() { var e = $(this); if (e.attr('name').match(/_fakeformerizefield$/)) return; if (e.val() == '') { e.addClass('formerize-placeholder'); e.val(e.attr('placeholder')); } }).focus(function() { var e = $(this); if (e.attr('name').match(/_fakeformerizefield$/)) return; if (e.val() == e.attr('placeholder')) { e.removeClass('formerize-placeholder'); e.val(''); } }); _form.find('input[type=password]').each(function() { var e = $(this); var x = $($('<div>').append(e.clone()).remove().html().replace(/type="password"/i, 'type="text"').replace(/type=password/i, 'type=text')); if (e.attr('id') != '') x.attr('id', e.attr('id') + '_fakeformerizefield'); if (e.attr('name') != '') x.attr('name', e.attr('name') + '_fakeformerizefield'); x.addClass('formerize-placeholder').val(x.attr('placeholder')).insertAfter(e); if (e.val() == '') e.hide(); else x.hide(); e.blur(function(event) { event.preventDefault(); var e = $(this); var x = e.parent().find('input[name=' + e.attr('name') + '_fakeformerizefield]'); if (e.val() == '') { e.hide(); x.show(); } }); x.focus(function(event) { event.preventDefault(); var x = $(this); var e = x.parent().find('input[name=' + x.attr('name').replace('_fakeformerizefield', '') + ']'); x.hide(); e.show().focus(); }); x.keypress(function(event) { event.preventDefault(); x.val(''); }); });  _form.submit(function() { $(this).find('input[type=text],input[type=password],textarea').each(function(event) { var e = $(this); if (e.attr('name').match(/_fakeformerizefield$/)) e.attr('name', ''); if (e.val() == e.attr('placeholder')) { e.removeClass('formerize-placeholder'); e.val(''); } }); }).bind("reset", function(event) { event.preventDefault(); $(this).find('select').val($('option:first').val()); $(this).find('input,textarea').each(function() { var e = $(this); var x; e.removeClass('formerize-placeholder'); switch (this.type) { case 'submit': case 'reset': break; case 'password': e.val(e.attr('defaultValue')); x = e.parent().find('input[name=' + e.attr('name') + '_fakeformerizefield]'); if (e.val() == '') { e.hide(); x.show(); } else { e.show(); x.hide(); } break; case 'checkbox': case 'radio': e.attr('checked', e.attr('defaultValue')); break; case 'text': case 'textarea': e.val(e.attr('defaultValue')); if (e.val() == '') { e.addClass('formerize-placeholder'); e.val(e.attr('placeholder')); } break; default: e.val(e.attr('defaultValue')); break; } }); window.setTimeout(function() { for (x in _fakes) _fakes[x].trigger('formerize_sync'); }, 10); }); return _form; };
				$form.n33_formerize();
			}
		}

		// Scrolly links.
		$('.scrolly').scrolly();
		
		// Header.
		// If the header is using "alt" styling and #banner is present, use scrollwatch
		// to revert it back to normal styling once the user scrolls past the banner.
		if ($header.hasClass('alt') &&	$banner.length > 0) {
			$window.on('load', function() {
				$banner.scrollwatch({
					delay:		0,
					range:		0.98,
					anchor:		'top',
					on:			function() { $header.addClass('alt reveal'); },
					off:		function() { $header.removeClass('alt'); }
				});
				skel.change(function() {
					if (skel.isActive('medium'))
						$banner.scrollwatchSuspend();
					else
						$banner.scrollwatchResume();
				});
			});
		}
			
		// Dropdowns.
		$('#nav > ul').dropotron({
			alignment: 'right'
		});
			
		// Slider.
		var $sliders = $('.slider');
		
		if ($sliders.length > 0) {
			$sliders.slidertron({
				mode: 'fadeIn',
				seamlessWrap: true,
				viewerSelector: '.viewer',
				reelSelector: '.viewer .reel',
				slidesSelector: '.viewer .reel .slide',
				advanceDelay: 0,
				speed: 400,
				fadeInSpeed: 1000,
				autoFit: true,
				autoFitAspectRatio: (840 / 344),
				navPreviousSelector: '.nav-previous',
				navNextSelector: '.nav-next',
				indicatorSelector: '.indicator ul li',
				slideLinkSelector: '.link'
			});
			$window
				.on('resize load', function() {
					$sliders.trigger('slidertron_reFit');
				})
				.trigger('resize');
		}

		// dispatch an event to the document to inform them that we are initialised
		document.dispatchEvent(new Event('documentinitialised'));

		// update the display of the firebase user
		var user = firebaseData.getUser();
		updateFirebaseUserDisplay(user);
		if (user) {
			// dispatch this change to the document (cached user logged in)
			document.dispatchEvent(new Event('firebaseuserchange'));
		}
	};

	function importHtmlToElement(elmnt, isLastElement) {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				// set the content of the element
				if (this.status == 200) {elmnt.innerHTML = this.responseText;}	
				if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
				/* Remove the attribute, and call this function once more: */
				elmnt.removeAttribute("include-html");
				if (isLastElement) {
					// this is the last one done, initialise the page now
					initialiseLoadedPage();
				}
			}
		}
		var file = elmnt.getAttribute("include-html");
		xhttp.open("GET", file, true);
		xhttp.send();
	};

	function constructHtmlDocumentContent() {
		var z, i, elmnt, file;
		/* Loop through a collection of all HTML elements: */
		z = document.getElementsByTagName("*");
		var foundElements = [];
		for (i = 0; i < z.length; i++) {
		  elmnt = z[i];
		  /*search for elements with a certain atrribute:*/
		  file = elmnt.getAttribute("include-html");
		  if (file) {
			  // this element has the attribute
			  foundElements.push(elmnt);
		  }
		}

		if (foundElements.length == 0) {
			// there are none, just initialise the page here
			initialiseLoadedPage();
		}
		else {
			for (i = 0; i < foundElements.length; i++) {
				// for each found element, get the HTML from the file and put it in the object
				importHtmlToElement(foundElements[i], i == foundElements.length - 1);
			}
		}
	};

	$(function() {
		// called (jquery) then the page is ready to do things on	

		// // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
		// // The Firebase SDK is initialized and available here!
		//
		// firebase.auth().onAuthStateChanged(user => { });
		// firebase.database().ref('/path/to/ref').on('value', snapshot => { });
		// firebase.messaging().requestPermission().then(() => { });
		// firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
		//
		// // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
		try {
			let app = firebase.app();
			let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] ===
				'function');
				console.log(`Firebase SDK loaded with ${features.join(', ')}`);
		} catch (e) {
			console.error(e);
		}
		
		// import all the HTML to construct the page properly
		constructHtmlDocumentContent();
	});

})(jQuery);