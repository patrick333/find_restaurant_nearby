if (!_FRN_) var _FRN_={};
$(document).ready(function() {

_FRN_.init=function(){
    _FRN_.columns = [{
		name: "name",
        label: "Name",
		editable: false,
		cell: "string"
    },{
        name: "address",
        label: "Address",
        editable: false,
        cell: "string"
    },{
        name: "phone",
        label: "Telephone",
        editable: false,
        cell: "string"
    }];

	_FRN_.lastFocusMarker=null;
	var input = document.getElementById('address');

	var autocomplete = new google.maps.places.Autocomplete(input);

	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		_FRN_.place = autocomplete.getPlace();
		if (!_FRN_.place.geometry) {
			return;
		}
		console.log(_FRN_.place);
	});


	$('body').on('click','.backgrid > tbody > tr',function(event){
        $(this).addClass('active');
        $(this).siblings().removeClass('active');

        var marker=_FRN_.markers[this.cells[0].firstChild.nodeValue];
        google.maps.event.trigger(marker,'click');
	});

	$('#sort').change(function() {
		console.log('select changing...');
		if($('#sort').val()=='google.maps.places.RankBy.PROMINENCE'){
			$('#radius-group').show();
		}
		else{
			$('#radius-group').hide();
		}
	});

};

_FRN_.searchPlaces=function(){
	// console.log('searching...');
	if(_FRN_.place==undefined){
		return;
	}
	_FRN_.restoCol= new _FRN_.RestoCol();

	var placeLoc=new google.maps.LatLng(_FRN_.place.geometry.location.A,_FRN_.place.geometry.location.F);
	var mapOptions = {
		center: placeLoc,
		zoom: 13
	};

	_FRN_.map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
	if($('#map-canvas').is(':visible')==false){
		$('#map-canvas').show();
	}
	if($('#map-list').is(':visible')==false){
		$('#map-list').show();
	}
	_FRN_.markers={};

	var request = {
		location:placeLoc,
		types: ['restaurant']
	};
	if($('#sort').val()=='google.maps.places.RankBy.PROMINENCE'){
		request['radius']=$('#radius').val();
	}
	else{
		request['rankBy']=google.maps.places.RankBy.DISTANCE;
	}

	_FRN_.infowindow = new google.maps.InfoWindow();
    _FRN_.service = new google.maps.places.PlacesService(_FRN_.map);
    _FRN_.service.nearbySearch(request, _FRN_.searchPlacesCB);

	console.log(request);
	console.log('searching done.');
};

_FRN_.searchPlacesCB=function(results, status,pagination) {
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {

            _FRN_.service.getDetails({ placeId: results[i].place_id }, function(details, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    var resto={
                        name:details.name,
                        address:details.vicinity,
                        phone:details.formatted_phone_number,

                        lat:details.geometry.location.A,
                        lng:details.geometry.location.F
                    };

                    _FRN_.restoCol.add(new _FRN_.Resto(resto));
                }
            });
		}

		if (pagination.hasNextPage) {
			pagination.nextPage();
		}
		else{
			console.log('all restaurants fetched...');

			_FRN_.grid = new Backgrid.Grid({
				columns: _FRN_.columns,
				collection: _FRN_.restoCol
			});

			_FRN_.paginator = new Backgrid.Extension.Paginator({
				collection: _FRN_.restoCol
			});

			$("#grid").html(_FRN_.grid.render().$el);
			$("#paginator").html(_FRN_.paginator.render().$el);

			_FRN_.createMarkers(_FRN_.restoCol);
		}
	}
};

_FRN_.setAllMap=function(map) {
	for(var p in _FRN_.markers){
		_FRN_.markers[p].setMap(map);
	}
};

_FRN_.hideAllMarkers=function() {
	_FRN_.setAllMap(null);
};

_FRN_.createMarkers=function(restoCol){
	var bounds = new google.maps.LatLngBounds();

	restoCol.each(function(resto, i) {
		var marker = new google.maps.Marker({
			map: _FRN_.map,
			title: resto.get('name'),
			icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
			position: resto.LatLng()
		});
		_FRN_.markers[resto.get('name')]=marker;


		google.maps.event.addListener(marker, 'click', function() {
			if(_FRN_.lastFocusMarker!=null){
				_FRN_.lastFocusMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
			}
			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
			_FRN_.lastFocusMarker=marker;

			_FRN_.infowindow.setContent(resto.get('name'));
			_FRN_.infowindow.open(_FRN_.map, this);

            var $theTd=$('.backgrid td').filter(function(){
                return $(this).text() === marker.title;
            }).parent();
            if($theTd.length > 0&&$theTd.hasClass('active')==false){
                $theTd.trigger( "click" );
            }
		});

		bounds.extend(resto.LatLng());
	});

	_FRN_.map.fitBounds(bounds);
};


_FRN_.Resto=Backbone.Model.extend({
	defaults: {
		name:'',
        address:'',
        phone:'',
		lat:0,
		lng:0
	},
	initialize: function(){
		this.on('change', function(model) {
		});	
	},//end of initialize.
	LatLng:function(){
		return new google.maps.LatLng(this.get('lat'),this.get('lng'));
	}
});

_FRN_.RestoCol =Backbone.PageableCollection.extend({
	model: _FRN_.Resto,
	mode: "client",
	state:{firstPage: 1, pageSize: 10},
    initialize: function(){
    	this.on('reset',this.onReset,this);

    },
    onReset:function(){
    	_FRN_.hideAllMarkers();
		_FRN_.createMarkers(_FRN_.restoCol);
    }

});


google.maps.event.addDomListener(window, 'load', _FRN_.init);


});