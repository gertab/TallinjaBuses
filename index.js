
var map;

function initMap() {
    var positionCookie = getCookie("position");
    var zoomCookie = getCookie("zoom");
    var previousPosition, previousZoom;

    if (zoomCookie == null || zoomCookie == "") {
        previousZoom = 13
    } else {
        try {
            previousZoom = parseInt(zoomCookie);
        } catch {
            previousZoom = 13
        }
    }

    defaultPos = {
        lat: 35.900816047126355, lng: 14.48355271309409
    };

    if (positionCookie == null || positionCookie == "") {
        previousPosition = defaultPos;
    } else {
        try {
            previousPosition = JSON.parse(positionCookie);
        } catch (e) {
            previousPosition = defaultPos;
        }

    }

    // console.log("previousPosition");
    // console.log(previousPosition);

    map = new google.maps.Map(document.getElementById('map'), {
        center: previousPosition,
        zoom: previousZoom,
        fullscreenControl: false,
        mapTypeControl: false,
        panControl: false,
        streetViewControl: false,
        mapId: 'fddf6da0fd60a73c'
        // mapTypeId: google.maps.MapTypeId.ROADMAP
    });


    var input = document.getElementById('pac-input');

    // var card = document.getElementById('pac-card');
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

    var infowindow = new google.maps.InfoWindow;

    // Close infowindow when pressing outside
    map.addListener('click', function () {
        infowindow.close();
    })

    // Search autocomplete
    var autocomplete = new google.maps.places.Autocomplete(input, {
        // bounds: new google.maps.LatLngBounds(
        //     new google.maps.LatLng(35.685032, 13.902002),
        //     new google.maps.LatLng(36.147092, 14.734407)
        // ),
        componentRestrictions: { country: "mt" },
        strictBounds: true
    })


    // autocomplete.bindTo('bounds', map);

    // Set the data fields to return when the user selects a place.
    autocomplete.setFields(
        ['address_components', 'geometry', 'icon', 'name']);

    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    autocomplete.addListener('place_changed', function () {
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();
        // var places = searchBox.getPlaces();
        // console.log(places)
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            // window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
        }
        marker.setPosition(place.geometry.location);
        marker.setTitle(place.name);
        // marker.setVisible(true);

        var address = '';
        if (place.address_components) {
            address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        infowindowContent.children['place-icon'].src = place.icon;
        infowindowContent.children['place-name'].textContent = place.name;
        infowindowContent.children['place-address'].textContent = address;
        // infowindow.open(map, marker);
    });


    map.addListener('dragend', function () {
        // console.log('dragend');
        
        var position = map.getCenter();
        createCookie('position', JSON.stringify(position), 100);
        // console.log(JSON.stringify(position));

        var zoom = map.getZoom();
        createCookie('zoom', zoom, 100);
    })

    // HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // infowindow.setPosition(pos);
            // infowindow.setContent('Location found.');
            // infowindow.open(map);

            map.setCenter(pos);
            map.setZoom(16);
        }, function () {
            handleLocationError(true, infowindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infowindow, map.getCenter());
    }

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        if (false) { // todo add proper error handling
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
                'Error: The Geolocation service failed.' :
                'Error: Your browser doesn\'t support geolocation.');
            infoWindow.open(map);
        }
    }

    //  var marker1 = new google.maps.Marker({position: {lat: 35.9000938155785, lng: 14.4849268223572}, map: map});


    function comingBus(BusStop) {

        // console.log("coming bus");
        // console.log(BusStop);


        var http = new XMLHttpRequest();

        return new Promise(function (resolve, reject) {
            var url = 'https://www.publictransport.com.mt/appws/StopsMap/GetComingBus';
            var body = {
                BusStop: {
                    I: BusStop.BusStopId,
                    Z: BusStop.Z,
                    L: []
                }
            };

            BusStop.Routes.forEach(route => {
                body.BusStop.L.push({
                    I: route.RouteId,
                    N: route.RouteNumber,
                    D: route.Description
                });
            })

            //            console.log(body.BusStop);
            http.open('POST', url, true);

            //Send the proper header information along with the request
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.setRequestHeader('x-api-version', '1.4.6');

            // http.onreadystatechange = function() {//Call a function when the state changes.
            //     if(http.readyState == 4 && http.status == 200) {
            //         'alert(http.responseText);
            //     }
            // }

            http.onload = function () {
                var jsonResponse = JSON.parse(http.responseText);
                //console.log(http.responseText);
                // console.log(jsonResponse);
                resolve(jsonResponse);
            }

            http.send(JSON.stringify(body));
        })
    }

    function locations() {
        return new Promise(function (resolve, reject) {


            readTextFile("busstops.json", function (text) {
                var busStops = JSON.parse(text);

                if (busStops == null) {
                    return;
                }

                var infowindow = new google.maps.InfoWindow();

                busStops.forEach(busStop => {

                    var latLng = new google.maps.LatLng(parseFloat(busStop.Latitude), parseFloat(busStop.Longitude));
                    var marker = new google.maps.Marker({ position: latLng, map: map/*, label: busStop.name*/ });

                    marker.addListener('click', function () {
                        var contentString = '<b>' + busStop.Name + '</b> (' + busStop.BusStopId + ')';
                        var contentStringLocal = contentString;

                        var uniqueRoutes = new Set();
                        busStop.Routes.forEach(route => {
                            var routeDetails = route.RouteNumber + " " + route.Description;
                            if(!uniqueRoutes.has(routeDetails)) {
                                // Avoid repeated routes
                                contentStringLocal += '<br>' + routeDetails;
                                uniqueRoutes.add(routeDetails);
                            }
                        });

                        infowindow.setContent(contentStringLocal);
                        infowindow.open(map, marker);

                        comingBus(busStop).then(result => {
                            contentString += coalesceBusRoutes(result.Stops[0].L);
    
                            // result.Stops[0].L.forEach(stop => {

                            //     // console.log(stop)
                            //     contentString += '<br>' + stop.N + " " + stop.D
                            //     if (stop.RA) {
                            //         contentString += ' : <b>' + stop.AT + ' mins </b>' //'<div align=\"right\"> ' + stop.AT + ' mins </div>'
                            //     }

                            // });

                            infowindow.setContent(contentString);
                            // infowindow.open(map, marker);

                        });


                        // console.log("contentString...");
                        // console.log(contentString);
                        // console.log("...contentString");

                    });
                });

                return resolve();
            });
        })

    }

    locations();

}

function coalesceBusRoutes(buses) {
    function setValue(map, key, value) {
        if (map.has(key)) { 
            map.set(key,[...map.get(key), value]);
        } else {
            map.set(key,[value]);
        }
    }
    
    var busesWithArrivalTime = new Map();
    var busesWithoutArrivalTime = new Set();

    buses.forEach(bus => {
        var N = bus.N;
        var D = bus.D;
        // var busRoute = N + " " + D;
        if(bus.RA) {
            if(busesWithArrivalTime.has(bus.N)) {
                setValue(busesWithArrivalTime.get(bus.N), bus.D, bus.AT);
            } else {
                busesWithArrivalTime.set(bus.N, new Map([[bus.D, [bus.AT]]]));
            }
        } else if (!busesWithArrivalTime.has({N, D})) {
            busesWithoutArrivalTime.add({N: N, D: D});
        }
    });

    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

    const busesWithArrivalTimeSorted = new Map([...busesWithArrivalTime].sort(collator.compare));

    const busesWithoutArrivalTimeSorted = busesWithoutArrivalTime;
    // todo fix sorting
    // const busesWithoutArrivalTimeSorted = new Set([...busesWithoutArrivalTime].sort(collator.compare));

    var unique = new Set();
    var resultString = "";
    busesWithArrivalTimeSorted.forEach((value, key) => {
        value.forEach((innerValueTime, innerKeyRouteDescription) => {
            resultString += '<br>' + key +  ' ' + innerKeyRouteDescription;
            resultString += ' : <b>' + innerValueTime.join(", ") + ' mins </b>';
            unique.add(key + ' ' + innerKeyRouteDescription);
        });
    });
    busesWithoutArrivalTimeSorted.forEach( (k)  => {
        if(!unique.has(k.N + ' ' + k.D)) {
            resultString += '<br>' + k.N + " " + k.D;
            unique.add(k.N + ' ' + k.D);
        }
    });

    return resultString;
}

// function testCoalesceBusRoutes() {
//     var test = coalesceBusRoutes([
//         {
//             "I": "3030002",
//             "N": "903",
//             "D": "Vapur - Victoria",
//             "AT": "0",
//             "O": null,
//             "RA": false
//         },
//         {
//             "I": "3030002",
//             "N": "43",
//             "D": "Vapur - Victoria",
//             "AT": "0",
//             "O": null,
//             "RA": false
//         },
//         {
//             "I": "3030002",
//             "N": "303",
//             "D": "Vapur - Victoria",
//             "AT": "6",
//             "O": null,
//             "RA": true
//         },
//         {
//             "I": "3030004",
//             "N": "303",
//             "D": "Vapur - Victoria",
//             "AT": "12",
//             "O": null,
//             "RA": true
//         },
//         {
//             "I": "3030012",
//             "N": "303",
//             "D": "Vapur - Victoria",
//             "AT": "",
//             "O": null,
//             "RA": false
//         }
//     ]);
//     console.log("test");
//     console.log(test);
// }

function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}


function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

window.initMap = initMap;
