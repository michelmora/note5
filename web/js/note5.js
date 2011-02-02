// Note5 Document class
var Note5Doc = function() {
  date = new Date();
  this.name = date.get8601Date() + '.' + date.get8601Time();
  this.content = '';
};

// Note5 Application static class
var Note5 = {
  updateTime: 500,
  localStorageKey: 'Note5.notes',
  init: function() {
    window.onerror = this.errorHandler;
    this.doc.view = this.view;
    this.view.doc = this.doc;
    this.setupButtonHandlers();
    setTimeout('Note5.view.refreshPage()', Note5.updateTime);

    // Load notes from local storage
    this.doc.loadLocal();
    
    // If there are no notes, create one
    if(this.doc.notes.length < 1) {
      this.cmdNew();
    }
    else {
      this.view.refreshSavedArea();
      this.view.refreshNote();
    }
    
    CacheHelper.setStatusDiv('#offlineStatus'); 
  },
  
  // Document subclass
  doc: {
    view: null,
    notes: [],
    currentNoteIndex: -1,
    setIndex: function(i) { this.currentNoteIndex = i; },
    add: function(doc) { return this.notes.push(doc); },
    getNote: function(i) { return notes[i]; },
    getCurrentNote: function() { 
      if(this.currentNoteIndex >= 0) 
        return this.notes[this.currentNoteIndex];
    },
    updateCurrent: function(content) { 
      this.notes[this.currentNoteIndex].content = content;
    },
    
    findIndexByName: function(name) {
      for(var i = 0; i < this.notes.length; i++) {
        if(this.notes[i].name == name)
          return i;
      }
      return -1;
    },
    
    // Save to local storage (requires HTML5 support)
    saveLocal: function() {
      currentNoteName = ''; 
      if(this.currentNoteIndex >= 0)
        currentNoteName = this.notes[this.currentNoteIndex].name;
      data = { notes: this.notes, currentNoteName: currentNoteName };
      json = JSON.stringify(data);
      if(window.localStorage) {
        window.localStorage.setItem(Note5.localStorageKey, json);
      } else {
        $('#saved_message').html('<b style="color:red">Warning:</b> Old browser. Your changes will not be saved when you reload :(');
      }
    },
    
    // Load from local storage (requires HTML5 support)
    loadLocal: function() {
      if(window.localStorage) {
        json = window.localStorage.getItem(Note5.localStorageKey);
        if(json) {
          data = JSON.parse(json);
          if(data) {
            this.notes = data.notes;
            currentNoteName = data.currentNoteName;
            this.currentNoteIndex = this.findIndexByName(currentNoteName);
          }
        }
      }      
    }
  },
  
  // View subclass
  view: {
    doc: null,
    updateRunning: false,
    
    // Refresh everything that needs to be updated every updateTime milliseconds
    refreshPage: function(force) {
      if(this.updateRunning) return;
      this.updateRunning = true;

      // If text hasn't changed since last update, return
      var noteVal = $('#note').val();
      if(!force && noteVal == this.doc.getCurrentNote().content) {
        setTimeout('Note5.view.refreshPage()', Note5.updateTime);
        this.updateRunning = false;
        return;
      }
      
      // Resize note area, if necessary
      $('#note').get(0).resize();
      
      // Save note content to doc
      this.doc.updateCurrent(noteVal);
      
      // Save all notes locally
      this.doc.saveLocal();

      this.refreshSavedArea();

      setTimeout('Note5.view.refreshPage()', Note5.updateTime);
      this.updateRunning = false;
    },
    
    // Refresh the 'Saved' tab
    refreshSavedArea: function() {
      var savedList = '<ul>';
      for(var i = 0; i < this.doc.notes.length; i++) {
        note = this.doc.notes[i];
        content = note.content;
        name = note.name;
        if(content.length > 24)
          content = content.substr(0, 24) + '...';
        savedList += '<li><button onclick="Note5.cmdRemoveConfirm(\''+name+'\');"><img src="images/icon_recycle.png" style="width:1.5em; height:1.5em;" alt="Delete" title="Delete" /></button>' + 
          ' <a href="#'+name+'" onclick="Note5.cmdMakeActive(\''+name+'\');">'+name+'</a> <i>'+content+'</i></li>';
      }
      savedList += '</ul>'+"\n";
      $('#saved_docs').html(savedList);
      var numDocs = this.doc.notes.length;
      if(numDocs == 0) numDocs = '';
      $('#num_saved').html(numDocs);
    },
    
    refreshNote: function() {
      $('#note').html(this.doc.getCurrentNote().content);
    }
  },
  
  // Command: Create a new note
  cmdNew: function() {
    var newDoc = new Note5Doc();
    this.doc.setIndex(this.doc.add(newDoc)-1);
    $('#note').val(this.doc.getCurrentNote().content);
    this.view.refreshPage(true);
    $('#button_home').click();
    $('#note').focus();
  },
  
  // Command: Make the selected note active
  cmdMakeActive: function(name) {
    var index = this.doc.findIndexByName(name);
    if(index >= 0 ) {
      this.doc.setIndex(index);
      $('#note').val(this.doc.getCurrentNote().content);
      $('#button_home').click();
      this.doc.saveLocal();
    }
  },
  
  cmdRemoveConfirm: function(name) {
    $( "#dialog-confirm-delete" ).dialog({
      resizable: false,
      //height:'15em',
      modal: true,
      buttons: {
        "Delete": function() {
          $( this ).dialog( "close" );
          Note5.cmdRemove(name);
        },
        "Cancel": function() {
          $( this ).dialog( "close" );
        }
      }
    });    
  },
  
  // Command: Remove the selected note
  cmdRemove: function(name) {
    var oldName = this.doc.getCurrentNote().name;
    removeIndex = this.doc.findIndexByName(name);
    if(removeIndex >= 0) {
      this.doc.notes.splice(removeIndex, 1);
    }
    oldIndex = this.doc.findIndexByName(oldName);
    if(oldIndex >= 0) {
      this.doc.setIndex(oldIndex);
      this.doc.saveLocal();
      $('#note').val(this.doc.getCurrentNote().content);
    } else if(this.doc.notes.length) {
      this.doc.setIndex(0);
      this.doc.saveLocal();
      $('#note').val(this.doc.getCurrentNote().content);
    } else {
      this.doc.setIndex(-1);
      this.doc.saveLocal();
      this.cmdNew();
    }
    this.view.refreshSavedArea();
  },
  
  // Utility functions
  setupButtonHandlers: function() {
    $('#button_home').click( function() {
      $('#main').show('fast');
      $('#saved').hide('fast');
      $('#config').hide('fast');
    });
    $('#button_saved').click( function() {
      $('#main').hide('fast');
      $('#saved').show('fast');
      $('#config').hide('fast');
    });
    $('#button_config').click( function() {
      $('#main').hide('fast');
      $('#saved').hide('fast');
      $('#config').show('fast');
    });
    $('#button_new').click( function() {
      Note5.cmdNew();
    })
  },  
  resetApplication: function() {
    // Reset localstorage
    localStorage.removeItem(Note5.localStorageKey);
    $('#saved_message').html('Application has been reset: '+(new Date()).get8601Time());
  },
  
  errorHandler: function(errMsg, errUrl, errLine) {
    var errData = {
        version: note5fileVersion,
        type: -1,
        msg: errMsg,
        url: errUrl,
        line: errLine,
        appCodeName: navigator.appCodeName,
        appName: navigator.appName,
        appVersion: navigator.appVersion,
        cookieEnabled: navigator.cookieEnabled,
        platform: navigator.platform,
        userAgent: navigator.userAgent
    };
    
    if(typeof(errData.msg) != 'string')
      errData.msg = 'Unknown (not string)';
    
    jsonData = JSON.stringify(errData);
    
    data = jsonData.urlEncode();
    
    $.get('api/?action=log&type=-1&data='+data, function(data) {$('#error-return').html(data)} );
    
    /* Quiet errors for now
    $( "#dialog-error" ).dialog({
      resizable: false,
      //height:'15em',
      modal: true,
      buttons: {
        "Argh!": function() {
          $( this ).dialog( "close" );
        }
      }
    });
    */    
    
  },
  
  dummy: null
};
