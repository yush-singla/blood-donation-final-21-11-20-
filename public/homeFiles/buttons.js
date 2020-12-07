(".info-btn").click(function() {

  var userChosenNo = $(this).attr("id");

  var mssg = prompt("We value our donors. It is a humble request plz be " +
    "polite with them and don't bother them again and again if they don't pick up or hang up." +
    "There are many more people who will be more than happy to help YOU!!!!" +
    "\nPlease write YES below to continue "

  )
  if (mssg == "YES" || mssg == "yes" || mssg === "Yes") {
    $(".private" + userChosenNo).removeClass("hidden")

    $("#" + userChosenNo).addClass("hidden");
  }
});
