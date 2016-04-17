$(document).ready(function() {

  $('body').removeClass('no-js');
  if ($('.panel-cover').hasClass('panel-cover--collapsed')){
    $(".blog-button").html("目录")
  }
  $('a.blog-button').click(function() {
    $(this).html("目录")
    if ($('.panel-cover').hasClass('panel-cover--collapsed')) return;
    currentWidth = $('.panel-cover').width();
    if (currentWidth < 960) {
      $('.panel-cover').addClass('panel-cover--collapsed');
      $('.content-wrapper').addClass('animated slideInRight');
    } else {
      $('.panel-cover').css('max-width',currentWidth);
      $('.panel-cover').animate({'max-width': '420px', 'width': '30%'}, 400, swing = 'swing', function() {} );
    }
  });

  if (window.location.hash && window.location.hash == "#blog") {
    $('.panel-cover').addClass('panel-cover--collapsed');
  }

  if (window.location.pathname.substring(0, 5) == "/tag/") {
    $('.panel-cover').addClass('panel-cover--collapsed');
  }

  $('.btn-mobile-menu').click(function() {
    $('.navigation-wrapper').toggleClass('visible animated bounceInDown');
    $('.btn-mobile-menu__icon').toggleClass('hidden');
    $('.btn-mobile-close__icon').toggleClass('hidden');
  });

  $('.navigation-wrapper .blog-button').click(function() {
    $('.navigation-wrapper').toggleClass('visible');
    $('.btn-mobile-menu__icon').toggleClass('hidden');
    $('.btn-mobile-close__icon').toggleClass('hidden');
  });

  hljs.initHighlightingOnLoad();

  if ($('.panel-cover').hasClass('panel-cover--collapsed')) $("main_button").html("目录");
});

