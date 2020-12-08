$(".info-btn").click(function() {

  var userChosenNo = $(this).attr("id");

  var mssg = prompt("Please Make Sure you agree to the following guidelines before we show you contacts information,"+
"\n1. Please be civil and polite to the people you are contacting"+
"\n2. Please don't call the donors repetively and disturb their peace of mind "+
"\nPlease type YES if you agree"

  )
  if (mssg == "YES" || mssg == "yes" || mssg === "Yes") {
    $(".private" + userChosenNo).removeClass("hidden")

    $("#" + userChosenNo).addClass("hidden");
  }
});
