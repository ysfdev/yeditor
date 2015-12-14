
/*
*   Set Yeditor object settings and methods 
*/

var fs = require('fs');

var yeditor = new function() {
    
    //editor settings 
    this.editorMode = "python";
    this.editorTheme = "monokai";
   
    //this.editorMode = "";
    
    /*
    *   get editor and return the editor object
    */
    this.editor = function(){
      window.editor = ace.edit("editor");
      return window.editor
  };
  
    /*
    *   Change current mode of editor to the passing mode
    */
    this.changeMode = function(mode){
      this.editorMode = mode;
      this.editor().session.setMode("ace/mode/" + this.editorMode);
  };
    /*
    *   Get the current text in the editor 
    */
    this.getCurrentText = function(){
       
       console.log("getting editor text");
       var text = this.editor().getSession().toString();
       return text
  };
    /*
    *
    *   Insert New text to editor
    */
    this.insertText = function(text){
        
        this.editor().session.insert("alert");
    }
    /*
    *   Start editor with default mode
    */
    this.startEditor = function(){
        
     console.log("editor started");
     this.editor().session.setMode("ace/mode/" + this.editorMode);
     this.editor().setTheme("ace/theme/" + this.editorTheme);
      
  };
  
  /*
  * Download current content in the editor
  */
  this.getContentUrl = function() {
    
        this.editorContent = this.getCurrentText();
        this.encodedURI = encodeURIComponent(this.editorContent);
        /*
        //create invisible link 
        this.link = document.createElement("a");
        this.link.setAttribute("href", this.encodedURI);
        this.link.setAttribute("download", "code.txt");
        */
        if (this.editorContent != "") {
            //console.log('generated content url..')
            this.contentUrl = "http://yeditor-ysfdev.c9users.io/code.py";
            return this.contentUrl
        }
        else {
            console.log('got nothing')
        }

  }
  
    this.saveLocal = function() {
        
        this.editorContent = this.getCurrentText();
        this.encodedURI = encodeURIComponent(this.editorContent);
        
        if (this.editorMode == "python") {
            this.fileName = "code.py"
            
        }
        
        else if (this.editorMode == "javascript") {
            
            this.fileName = "code.js"
        }
        
        else if (this.editorMode == "ruby") {
            
            this.fileName = "code.rb"
        }
        
        else if (this.editorMode == "perl") {
            
            this.fileName = "code.pl"
        }
        
         //create invisible link 
        this.link = document.createElement("a");
        this.link.setAttribute("href", this.encodedURI);
        this.link.setAttribute("download", this.fileName);
        
    }
  
        if (this.editorContent != ""){
            
            //this.link.click();
        }
    
}


$(document).ready(function(){
 
        
    // Event Listeners 
    
    yeditor.startEditor();
    //yeditor.changeMode('javascript');
    
     $("#jsButton").click(function(){
        console.log('jseditor');
        yeditor.changeMode('javascript');
    });
    
    $("#pyButton").click(function(){
        yeditor.changeMode('python');
        console.log('python');
    });
    
     $("#phpButton").click(function(){
        yeditor.changeMode('PHP');
    });
    
     $("#perlButton").click(function(){
        yeditor.changeMode('perl');
    });
    
     $("#rubyButton").click(function(){
        
        yeditor.changeMode('ruby');
    });
    
    /*
    *   Render Google Drive Save button 
    */
    
    $('#render-link').click(function (){
        
        var downloadUrl = yeditor.getContentUrl();

        gapi.savetodrive.render('savetodrive-btn', {
            src:downloadUrl,
            filename: 'code.py',
            sitename: 'YEDITOR'
        });
        
         console.log('drive render started');
         //hide the save-drive button
         $('#render-link').hide();
         
    })
    
    
     $('#save-local').click(function (){
        
       var editorContent = yeditor.getCurrentText();
        var encodedURI = encodeURIComponent(editorContent);
        var editorMode = yeditor.editorMode;
        var fileName;
        
        if (editorMode == "python") {
            fileName = "code.py";
            
        }
        
        else if (editorMode == "javascript") {
            
            fileName = "code.js";
        }
        
        else if (editorMode == "ruby") {
            
            fileName = "code.rb";
        }
        
        else if (editorMode == "perl") {
            
            fileName = "code.pl";
        }
        
        else {
            
            fileName= "code.txt";
        }
         //create invisible link 
        var link = document.createElement("a");
        link.href = 'data:attachment/py,' + encodedURI;
        link.download = fileName;
        link.target = "_self";
        console.log(link)
        
        //console.log(editorContent);
        if (yeditor.editorContent != "") {
            document.body.appendChild(link)
            link.click();
            console.log('download started..')
        }
        else {
            console.log('got nothing')
            
        }
            
         
    });
   
});


// Drive API handlers

var client_id = '764640353236-2euqfn592tab7h3c3ulencphqde5age4.apps.googleusercontent.com'
var oauthToken;

function onApiLoad(){
    
    gapi.load('auth', {'callback':onAuthApiLoad()});
    gapi.load('picker');
}

function onAuthApiLoad(){
    
    window.gapi.auth.authorize({
    'client_id':client_id,
    'scope':['https://www.googleapis.com/auth/drive']
    }, handleAuthResult);
    
}


function handleAuthResult(authResult){
    if (authResult && !authResult.error){
        oauthToken = authResult.access_token;
        createPicker();
    }
}



function createPicker(){
    
    var picker = new google.picker.PickerBuilder()
        .setOAuthToken(oauthToken)
        .setDeveloperKey(client_id)
        .build();
        picker.setVisible(true);
     
     // add upload docs view 
     //.addView(new google.picker.DocsUploadView())
     
}


/*
function downloadCurrentContent () {
    
    var editorContent = yeditor.getCurrentText();
    var encodedURI = encodeURIComponent(editorContent);
    
    
   // console.log(var encodedURI)
    //create invisible link 
    var link = document.createElement("a");
    link.href = 'data:attachment/py,' + encodedURI;
    link.download = "code.py";
    link.target = "_self";
    console.log(link)
    
    console.log(editorContent);
    if (yeditor.editorContent != "") {
        document.body.appendChild(link)
        // link.click();
        console.log('download started..')
    }
    else {
        console.log('got nothing')
        
    }
}

*/


