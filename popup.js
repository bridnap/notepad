/*
    Simple Notepad Developed By Mr. Alien - Vaibhav Mehta

    Stackoverflow:  http://stackoverflow.com/users/1542290/mr-alien
    Email :         firekillz@gmail.com
*/

//Retrieve Last Updated Time
function showLastUpdated() {
  chrome.storage.local.get(function (fetch) {
    if(fetch._storeLastUpdated) {
      $("#showLastUpdated").text("Last Updated : " + fetch._storeLastUpdated);    
    } else {
      $("#showLastUpdated").text("Last Updated : Not Available");    
    } 
  });
}


function showNotification() {
  chrome.storage.local.get(function (fetch) {
    if(fetch._notificationSeen !== true) {
      $("#advanced-notepad-ext").removeClass('hide');
    } else {
      $("#advanced-notepad-ext").addClass('hide');
    } 
  });
}

showNotification();


//Delaying Core Edit
var delayCore = (function(){
  var timer = 0;
  return function(callback, ms) {
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();


//Storing Data To Local
function store() {
  delayCore(function() {
    var c = new Date();

    chrome.storage.local.set({
      '_noteContent': $("#edit").val(),
      '_storeLastUpdated': c.getDate() + "-" + (c.getMonth() + 1) + "-" + c.getFullYear() + '|' + c.getHours() + ':' + c.getMinutes() + ':' + c.getSeconds()
    });

    //Flash Save Message and Last Updated
    $("#developedBy, #exportBtn").fadeOut(0).delay(1200).fadeIn(200);
    $("#autosaver").text("Saved").fadeIn(200).delay(1000).fadeOut(200);

    showLastUpdated();
  }, 1000);
}


//Retrieve Data From Local
showLastUpdated();

chrome.storage.local.get(function (fetch) {
  $("#edit").val(fetch._noteContent);
  $("#edit").caret(fetch._caretPos);
  $('.last-backedup-data span').text(fetch._lastBackedUpTimeStamp);
  $('.backup-id span').text(fetch._lastBackedUpId);
});


//Storing Cursor Position
$("#edit").on("keyup click", function() {
  chrome.storage.local.set({
    '_caretPos': $(this).caret()
  });
});


//Storing Texts And Updating Storage Time
$('#edit').on('input', function(e) {
  store();
});


//Simulating Tab
$("#edit").on("keydown", function(e) {
  var keyCode = e.keyCode || e.which;
  var t =  $(this);
  if (keyCode == 9) {
    e.preventDefault();
    var start = t.get(0).selectionStart;
    var end = t.get(0).selectionEnd;
    t.val(t.val().substring(0, start) + "\t" + t.val().substring(end));
    t.get(0).selectionStart =
    t.get(0).selectionEnd = start + 1;

    store(); //Trigger Storage
  }
});


//Export Functionality
$("#exportBtn").on("click", function(event) {
  event.preventDefault;

  var $exportBtn = $("#exportBtn");
  var $edit = $("#edit").val().replace(/\n/g, '\r\n');

  if($edit == "" || $edit == "None Found") {
    $exportBtn.attr("href", "#");
    $exportBtn.removeAttr("download");
  } else {
    $exportBtn.attr("href", "data:text/plain;base64," + btoa($edit));
    $exportBtn.attr("download", "");
  }
});

$('#backupBtn').on('click', function(e) {
  e.preventDefault();

  $('.backup-modal').removeClass('hide');
});

$('#backup-data-now').on('click', function(e) {
  e.preventDefault();

  $(this).text('Backing up your notes...');

  chrome.storage.local.get(function(fetch) {
    if(!fetch._lastBackedUpId) {
      var dataObj = {
        data: fetch._noteContent,
        app: 'chrome-simplenotepad-extension'
      }
      
      $.ajax({
        url: 'https://jsonbin.io/b/new',
        type: 'post',
        dataType: 'json',
        data: {
          snippet: JSON.stringify(dataObj)
        },
        success: function(data) {
          var c = new Date();

          chrome.storage.local.set({
            '_lastBackedUpId': data.id,
            '_lastBackedUpTimeStamp': c.getDate() + "-" + (c.getMonth() + 1) + "-" + c.getFullYear() + '|' + c.getHours() + ':' + c.getMinutes() + ':' + c.getSeconds()
          });

          chrome.storage.local.get(function(fetchRecent) {
            $('.last-backedup-data span').text(fetchRecent._lastBackedUpTimeStamp);
            $('.backup-id span').text(fetchRecent._lastBackedUpId);
          });

          $('#backup-data-now').text('Backup Data Now');
        }
      });
    } else {
      var dataObj = {
        data: fetch._noteContent,
        app: 'chrome-simplenotepad-extension'
      }

      $.ajax({
        url: 'https://jsonbin.io/b/update/' + fetch._lastBackedUpId,
        type: 'post',
        dataType: 'json',
        data: {
          snippet: JSON.stringify(dataObj)
        },
        success: function(data) {
          var c = new Date();

          chrome.storage.local.set({
            '_lastBackedUpTimeStamp': c.getDate() + "-" + (c.getMonth() + 1) + "-" + c.getFullYear() + '|' + c.getHours() + ':' + c.getMinutes() + ':' + c.getSeconds()
          });

          chrome.storage.local.get(function(fetchRecent) {
            $('.last-backedup-data span').text(fetchRecent._lastBackedUpTimeStamp);
          });

          $('#backup-data-now').text('Backup Data Now');
        }
      });
    }
  });
});

$('.close-backup-modal').on('click', function() {
  $(this).parent('.backup-modal').addClass('hide');
})

$('.recover-btn').on('click', function(e) {
  e.preventDefault();

  var backupId = $('#restoreId').val();

  $.ajax({
    url: 'https://jsonbin.io/b/' + backupId + '/latest',
    type: 'get',
    dataType: 'json',
    success: function(data) {
      chrome.storage.local.set({
        '_noteContent': data.data
      });

      $('#edit').val(data.data);
      $('.recover-suc').removeClass('hide').text('Data recovered successfully');
      $('#restoreId').val('');

      setTimeout(function() {
        $('.recover-suc').addClass('hide').text('');
      }, 2000);

      
    },
    error: function(data) {
      var res = JSON.parse(data.responseText);

      $('.recover-err').removeClass('hide').text(res.message);

      setTimeout(function() {
        $('.recover-err').addClass('hide').text('');
      }, 2000);
    }
  });
});


$("#close-notification").on("click", function() {
  chrome.storage.local.set({
    '_notificationSeen': true
  });

  $("#advanced-notepad-ext").addClass('hide');
});