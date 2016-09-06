// initializeSkinDropdown.js initalializes the skin dropdown 
// and returns a skin object with functions to retrieve a default
// skin pallete as well as a particular skin pallete. 

define([
    'skins'
],

function(skins) 
{
  var arr = [];
  for(var i in skins){
    arr.push(skins[i]);
  }
  
  
  for(var i = 0; i < arr.length; i++){
    var dropdown = document.getElementById("skin-dropdown");
    var opt = document.createElement("option"); 
    opt.text = arr[i].name;
    opt.value = arr[i].name;
    dropdown.options.add(opt);
  }

  function defaultSkin(){
    return arr[0].pallete;
  }
  
  function getPallete(skin_name){
    return skins[skin_name].pallete;
  }

	return {defaultSkin:defaultSkin,
          getPallete:getPallete}
});