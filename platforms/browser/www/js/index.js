function reloadThePage(){
    startGame();
} 
var myGamePiece;
var myObstacles = [];
var myScore;

function startGame() {
    myGamePiece = new component(20, 10, "red", 10, 75);
    myScore = new component("7px", "Arial", "Blue", 200, 20, "text");
    myGameArea.start();
}

var myGameArea = {
    canvas : $('#obstacleGame'),
    start : function() {
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.context = this.canvas[0].getContext("2d");
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
        },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop : function() {
        clearInterval(this.interval);
    }
}

function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;    
    this.x = x;
    this.y = y;    
    this.update = function() {
        ctx = myGameArea.context;
        if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;        
    }
    this.crashWith = function(otherobj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

function updateGameArea() {
    var x, height, gap, minHeight, maxHeight, minGap, maxGap;
    for (i = 0; i < myObstacles.length; i += 1) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            myGameArea.stop();
            return;
        } 
    }
    myGameArea.clear();
    myGameArea.frameNo += 1;
    if (myGameArea.frameNo == 1 || everyinterval(150)) {
        x = myGameArea.canvas.width;
        minHeight = 10;
        maxHeight = 100;
        height = Math.floor(Math.random()*(maxHeight-minHeight+1)+minHeight);
        minGap = 50;
        maxGap = 200;
        gap = Math.floor(Math.random()*(maxGap-minGap+1)+minGap);
        myObstacles.push(new component(10, height, "green", x, 0));
        myObstacles.push(new component(10, x - height - gap, "green", x, height + gap));
    }
    for (i = 0; i < myObstacles.length; i += 1) {
        myObstacles[i].speedX = -1;
        myObstacles[i].newPos();
        myObstacles[i].update();
    }
    myScore.text="SCORE: " + myGameArea.frameNo;
    myScore.update();
    myGamePiece.newPos();    
    myGamePiece.update();
}

function everyinterval(n) {
    if ((myGameArea.frameNo / n) % 1 == 0) {return true;}
    return false;
}

function moveup() {
    myGamePiece.speedY = -1; 
}

function movedown() {
    myGamePiece.speedY = 1; 
}

function moveleft() {
    myGamePiece.speedX = -1; 
}

function moveright() {
    myGamePiece.speedX = 1; 
}

function clearmove() {
    myGamePiece.speedX = 0; 
    myGamePiece.speedY = 0; 
}

var dbSize = 5 * 1024 * 1024;
var db;
var map;
var baseUrl = "http://vanapi.gitsql.net";
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}
function encodeImageUri(imageUri)
{
     var c=document.createElement('canvas');
     var ctx=c.getContext("2d");
     var img=new Image();
     img.onload = function(){
       c.width=this.width;
       c.height=this.height;
       ctx.drawImage(img, 0,0);
     };
     img.src=imageUri;
     var dataURL = c.toDataURL("image/jpeg");
     return dataURL;
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

var app = {

    initialize: function() {
        this.bindEvents();
    },
    
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    
    receivedEvent: function(readyText) {
        db = openDatabase("contactapp", "1", "Contact App", dbSize);
        db.transaction(function(tx){
            tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                    "contacts(ID INTEGER PRIMARY KEY ASC, strFullName, strEmail, strPhone, strPicture, lat, long, serverId)");
        });
        
        db.transaction(function(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                    "phonebook(ID INTEGER PRIMARY KEY ASC, strFullName, strPhone)");
        });
        
        function onGeoSuccess(position) {
            let coords = { 'lat': position.coords.latitude, 'long': position.coords.longitude };
            localStorage.setItem('currentPosition', JSON.stringify(coords));
            console.log(coords);
            
            var myLatLng = {lat: coords.lat, lng: coords.long};
            var map = new google.maps.Map(document.getElementById('map'), {
              zoom: 20,
              center: myLatLng
            });
    
            var marker = new google.maps.Marker({
              position: myLatLng,
              map: map,
              title: 'My Location'
            });
        }
        function onGeoError(error) {
            alert('code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
        }
        // Options: throw an error if no update is received every 30 seconds.
        geoOpts = { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true};
        // var watchID = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, geoOpts);
        var options = new ContactFindOptions();
        options.filter="";          // empty search string returns all contacts
        options.multiple=true;      // return multiple results
        filter = ["displayName"];   // return contact.displayName field
        // find contacts
        navigator.contacts.find(filter, onSuccess, onError, options);
        // onSuccess: Get a snapshot of the current contacts
        //
        function onSuccess(contacts) {
            for (var i=0; i<contacts.length; i++) {
                if (contacts[i].phoneNumbers) {  // many contacts don't have displayName
                    let name = contacts[i].displayName;
                    try {
                        name = contacts[i].name.givenName;
                    }
                    catch{
                        console.log('Unable to find givenName')
                    }
                    insertPhonebookRow(name, contacts[i].phoneNumbers[0].value); 
                    if (i == 20) break;
                }
            }
            alert('contacts loaded');
        }
        
        function onError(err){
            console.log(err);
        }
        async function displayContacts(tx, results){
            return new Promise((resolve, reject) => {
                var list = $("#contactListLi");
                list.empty();
                console.log(results.rows);
                var len = results.rows.length, i;
                for (i = 0; i < len; i++) {
                    list.append(`<li><a class="editContact" data-id="${results.rows.item(i).ID}">${results.rows.item(i).strFullName}</li>`);
                }
                $("#contactListLi").listview("refresh");
                resolve();
            });
        }
        async function displayPhoneContacts(tx, results){
            return new Promise((resolve, reject) => {
                var list = $("#phoneContactsListLi");
                list.empty();
                console.log(results.rows);
                var len = results.rows.length, i;
                for (i = 0; i < len; i++) {
                    list.append(`<li><a class="copyPhoneContact" data-id="${results.rows.item(i).ID}">${results.rows.item(i).strFullName}</li>`);
                }
                $("#phoneContactsListLi").listview("refresh");
                resolve();
            });
        }

          async function insertRow(field1, field2, field3, serverId = '', initial=false){
            return new Promise( async function(resolve, reject){
                let newRecord=true;
                let lat ='', long ='';
                            
                /*try {
                    ({lat, long} = JSON.parse(localStorage.getItem('currentPosition')));
                } catch (err){
                    // Looks like we have no currentPosition 
                    console.log(err);
                }*/
                if (serverId !==''){
                    let dupe = await checkDupeServerId(serverId);
                    if (dupe ) {
                        resolve();
                        newRecord = false;
                    }
                }
                if(newRecord){
                    // save our form to websql
                    db.transaction(function(tx){
                        tx.executeSql(`INSERT INTO contacts(strFullName, strEmail,  lat, long, serverId) VALUES (?,?,?,?,?)`, [field1, field2, lat, long, serverId], async (tx, res)=>{
                            console.log(res);
                            if(initial == false){
                                $.ajax({
                                    type: "POST",
                                    url: `${baseUrl}/contacts`,
                                    contentType: "application/json; charset=utf-8",
                                    dataType: "json",
                                    data:  JSON.stringify({
                                        firstName: field1,
                                        lastName: '',
                                        contactNumber: field2
                                    }),
                                    beforeSend: function(xhr){xhr.setRequestHeader('authtoken', localStorage.getItem('token'))},
                                    success: function(response) {
                                        db.transaction(function(tx){
                                            tx.executeSql(`update contacts set serverId = ? where id = ?`, [response.id, res.insertId], 
                                            (tx, result)=>{
                                                console.log(result);
                                                resolve(result);
                                            });
                                        });
                                    },
                                    error: function(e) {
                                        alert('Error: ' + e.message);
                                    }
                                });
                            }
                        });  
                    });
                }
            }); 
        }
        
        async function insertPhonebookRow(field1, field2){
            return new Promise(function(resolve, reject){
                
    
                // save our form to websql
                db.transaction(function(tx){
                    tx.executeSql(`INSERT INTO phonebook(strFullName, strPhone) VALUES (?,?)`, [field1, field2], (tx, res)=>{
                        console.log(res);
                        resolve(res);
                    });  
                });
            });
            
        }
        function openDBandLoadContacts(){
            db = openDatabase("contactapp", "1", "Contact App", dbSize);
            db.transaction(function(tx){
                tx.executeSql("SELECT * FROM contacts",[], async (tx, results)=>{
                    await displayContacts(null, results);
                    $(".editContact").bind( "tap", async (event) =>{
                        let record = await fetchRowFromContacts(event.target.getAttribute('data-id'));
                        $("#editContactId").val(record.ID);
                        $("#editContactServerId").val(record.serverId);
                        $("#editContactName").val(record.strFullName);
                        $("#editContactEmail").val(record.strEmail);
                        $("body").pagecontainer("change", "#editContactPage");
                    });
                });
            });
        }
       async function fetchRowFromContacts(id){
            return new Promise((resolve, reject)=>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql(`SELECT * FROM contacts where ID = ?`,[id], (tx, results)=>{
                        resolve(results.rows.item(0));
                    });
                });
            });
        }
        async function deleteContactFromDBandCloud(id, serverId){
            return new Promise((resolve, reject)=>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql(`delete FROM contacts where ID = ?`,[id], (tx, results)=>{
                        $.ajax({
                            type: "DELETE",
                            url: `${baseUrl}/contacts/${serverId}`,
                            contentType: "application/json; charset=utf-8",
                            beforeSend: function(xhr){xhr.setRequestHeader('authtoken', localStorage.getItem('token'))},
                            success: function(response) {
                                console.log(response);
                                resolve();
                            },
                            error: function(e) {
                                alert('Error: ' + e.message);
                            }
                        });
                    });
                });
            });
        }
        async function checkDupeServerId(serverId){
            return new Promise((resolve, reject)=>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql(`SELECT * FROM contacts where serverId = ?`,[serverId], (tx, results)=>{
                        if(results.rows.length>0){
                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    });
                });
            });
        }
        async function fetchRowFromPhoneContacts(id){
            return new Promise((resolve, reject)=>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql(`SELECT * FROM phonebook where ID = ?`,[id], (tx, results)=>{
                        resolve(results.rows.item(0));
                    });
                });
            });
        }
        async function updateContactsRow(data, serverId=''){
            return new Promise((resolve, reject) =>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction( (tx) =>{
                    tx.executeSql('UPDATE contacts SET strFullName=?, strEmail= ? WHERE id=?', [data.strFullName, data.strEmail, data.id], (tx, res) =>{
                        if(serverId !== ''){
                            $.ajax({
                                type: "PUT",
                                url: `${baseUrl}/contacts/${serverId}`,
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                data:  JSON.stringify({
                                    id: serverId,
                                    firstName: data.strFullName,
                                    lastName: '',
                                    contactNumber: data.strEmail
                                }),
                                beforeSend: function(xhr){xhr.setRequestHeader('authtoken', localStorage.getItem('token'))},
                                success: function(response) {
                                    resolve(res);
                                },
                                error: function(e) {
                                    alert('Error: ' + e.message);
                                }
                            });
                        } else{
                            resolve(res);
                        }
                    });
                });
            });
        }
        $(document).ready(function(){     
            $("#saveNewContact").bind( "tap", tapHandler );
            $("#saveEditContact").bind( "tap", saveEditHandler );
            $("#captureSelfie").bind( "tap", captureSelfie );
            $("#cleanupSelfies").bind( "tap", cleanUpTempPhotos );
            $("#loginButton").bind( "tap", performLogin);
            $("#deleteContact").bind( "tap", deleteContact);
            $("#initialSync").bind( "tap", initialSync);
            $("#button-show").hide();
            $("#startIt").bind( "tap", function(){
                startGame();
                $(this).hide();
                $('#button-show').show();
            });
            $("#button-show").bind( "tap", function(){
                startGame();
            });
            function initialSync(){
                $.ajax({
                    type: "GET",
                    url: `${baseUrl}/contacts`,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    beforeSend: function(xhr){xhr.setRequestHeader('authtoken', localStorage.getItem('token'))},
                    success: function(response) {
                        console.log(response);
                        asyncForEach(response, async (record) => {
                            await insertRow(record.firstName, record.contactNumber, record.email ,record.id, true);
                        });
                        
                        openDBandLoadContacts();
                    },
                    error: function(e) {
                        alert('Error: ' + e.message);
                    }
                }); 
            }
            function performLogin(){
                data = {
                    "username": $("#username").val(),
                    "password": $("#password").val()
                }
                $.ajax({
                    type: "POST",
                    url: `${baseUrl}/auth`,
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function(response) {
                        console.log(response);
                        localStorage.setItem('token', response.token);
                        $("body").pagecontainer("change", "#home");
                    },
                    error: function(e) {
                        alert('Error: ' + e.message);
                    }
                });
            }
            openDBandLoadContacts();
            async function tapHandler( event ){
                await insertRow($("#contactName").val(), $("#contactEmail").val(), $("#contactAge").val());
                $("body").pagecontainer("change", "#home");
            }
            async function saveEditHandler (event){
                let result = await updateContactsRow({
                    'id': $('#editContactId').val(), 
                    'strFullName': $('#editContactName').val(), 
                    'strEmail': $('#editContactEmail').val(),
                    'strAge': $('#editContactAge').val(),
                }, $('#editContactServerId').val());
                $("body").pagecontainer("change", "#home");
            }
            
            
async function deleteContact (event){
                // delete contact from webSQl db
                // send delete ajax to remove it from the server too
                await deleteContactFromDBandCloud($('#editContactId').val(), $('#editContactServerId').val());
                $("body").pagecontainer("change", "#home");
            }
            function captureSelfie(){
                navigator.camera.getPicture(onSuccess, onFail, 
                    { 
                        quality: 50,
                        destinationType: Camera.DestinationType.FILE_URI,
                        cameraDirection: Camera.Direction.FRONT
                    });
            
                function onSuccess(imageURI) {
                    var image = document.getElementById('selfie');
                    image.src = imageURI;
                    console.log(encodeImageUri(imageURI));
                }
                
                function onFail(message) {
                    alert('Failed because: ' + message);
                }
            }
            function cleanUpTempPhotos() {
                navigator.camera.cleanup(onSuccess, onFail);
                function onSuccess() {
                    alert("Camera cleanup success.")
                }
                function onFail(message) {
                    alert('Failed because: ' + message);
                }
            }
            $(document).on( 'pagebeforeshow' , '#home' ,function(event){
                openDBandLoadContacts();
            }); 
            $(document).on( 'pagebeforeshow' , '#phonebook' ,function(event){
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql("SELECT * FROM phonebook",[], async (tx, results)=>{
                        await displayPhoneContacts(null, results);
                        debugger;
                        $(".copyPhoneContact").bind( "tap", async (event) =>{
                            let record = await fetchRowFromPhoneContacts(event.target.getAttribute('data-id'));
                            await insertRow(record.strFullName, record.strPhone);
                            $("body").pagecontainer("change", "#home");
                        });
                    });
                });
            });
        });
    }
};