
var myApp = angular.module('myApp',[]);


myApp.controller('mainController', function($scope, $http, $window) {
    
     $.getJSON('http://ipinfo.io', function(data){
            $scope.getUsername();
            $scope.city = data.city;
            console.log("CITY " + $scope.city);
            $http.get("/search/bar/"+ $scope.city)
                .then(function (response) {
                 $scope.allBars=response.data;
        });  
        
     })
     
     $http.get("/bars/all")
            .then(function (response) {
            $scope.bars_db = response.data;
     });
        
     $scope.getUsername = function(){
         $http.get("/username")
            .then(function (response) {
         if(response)      
         $scope.userdata = response.data;
         else $scope.userdata=null;
         });
     } 
    
     $scope.getPeopleList = function(barName){
        
        for (var i=0;i< $scope.bars_db.length;i++){
            if($scope.bars_db[i].bar_name == barName)
                return $scope.bars_db[i].going_list;
        } 
        return [];
          
     } 
     
    
     $scope.searchMyLocation = function(){
                
        $http.get("/search/bar/"+ $scope.city)
        .then(function (response) {
             $scope.allBars=response.data;
        }); 
         
     }
     
     $scope.getAll = function(){
          $http.get("/bars/all")
            .then(function (response) {
            $scope.bars_db = response.data;
        });
        
     }
         
     $scope.logout = function() {
        $http.get("/logout")
        .then(function (response) {
             $scope.userdata = null;
             $scope.getAll();
             $window.location.href = '/home';
        }); 
    }; 
     
     $scope.going = function(barName, userName) {
 
         $scope.barName = barName;
         $scope.userName = userName;
         // $scope.user = "guest";
         $scope.string_API = "/addme/"+ $scope.barName +"/" +$scope.userName;
         console.log("Going Call to Server: "+ $scope.string_API);
    
         $http.get($scope.string_API)  //string 
        .then(function (response) {
             $scope.getAll();
             
             //$window.location.href = '/home';
        }); 
    };
    
     $scope.not_going = function(barName, userName) {
 
         $scope.barName = barName;
         $scope.userName = userName;
         // $scope.user = "guest";
         $scope.string_API = "/removeme/"+ $scope.barName +"/" +$scope.userName;
         console.log("Going Call to Server: "+ $scope.string_API);
    
         $http.get($scope.string_API)  //string 
        .then(function (response) {
             $scope.getAll();
             
             //$window.location.href = '/home';
        }); 
    };
      
    
}); 


 window.onload=function(){
     $(function(){
         if(window.location.protocol==="https:")
             window.location.protocol="http";
     });
 }



 
   
 






