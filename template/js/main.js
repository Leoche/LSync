﻿var ls;
jQuery(function($){
	ls = new GAMESYNC();
	ls.refreshAll();
	$("#menu a").click(function(e){
		e.preventDefault();
		$("#menu a.active").removeClass("active");
		$(this).addClass("active");
		var num = parseInt($(this).attr("data-tab").replace("pane-",""))-1;
		$("#panes").animate({
			left: -num*390
		});
	});
	$("#mod").change(function(e){
		e.preventDefault();
		var fd = new FormData();
  		fd.append("mod", $("#mod")[0].files[0]);
		var xhr = new XMLHttpRequest();
		xhr.open("POST","api/mods",true);
		xhr.onload =  function(e){
			var response = JSON.parse(e.target.responseText);
			if(response.code == "500") humane.log("Seules les extensions suivantes sont autorisées: .zip, .jar, .json, .txt");
			else if(response.code == "401") humane.log("Une erreur s'est produite, vérifier les permissions d'écriture du dossier mods");
			else if(response.code == "200") ls.refreshMod();
			$("#modupload-label").html("Uploader un mod");
		};
		xhr.upload.onprogress = function(e){
			if (e.lengthComputable) $("#modupload-label").html(Math.round(e.loaded/e.total * 100)+"%");
		};
		xhr.send(fd);
	});
	$("#add-whitelist").click(function(e){
		e.preventDefault();
		if($("#whitelist").val() == "") return;
		ls.addWhitelist($("#whitelist").val());
	});
	$("#refresh-mods").click(function(e){
		e.preventDefault();
		ls.refreshMod();
	});
	$(".changepassword").click(function(e){
		e.preventDefault();
		$("#pane-4").toggleClass("pane-password");
		$("#pass1,#pass2").val("");
	});
	$("#refresh-whitelists").click(function(e){
		e.preventDefault();
		ls.refreshWhitelist();
	});
	$("#maintenance").click(function(e){
		e.preventDefault();
		$(this).html("<i class='fa fa-refresh fa-spin'></i>");
		var bool = 1;
		if(ls.online) bool = 0;
		$.post("api/status/"+bool,function(res){
			var res = JSON.parse(res);
			if(res.code == "401")
				humane.log("Une erreur s'est produite, vérifier les permissions d'écriture du fichier config/options.json");
			ls.refreshStatus();
		});
	})
	$("#mod-list").on("click",".delete-mod",function(e){
		e.preventDefault();
		ls.deleteMod($(this).attr("data-mod"));
	});
	$("#white-list").on("click",".delete-whitelist",function(e){
		e.preventDefault();
		ls.deleteWhitelist($(this).attr("data-whitelist"));
	});
	$("#passwordchanger-form").submit(function(e){
		e.preventDefault();
		$pass1 = $("#pass1").val();
		$pass2 = $("#pass2").val();
		if($pass1 != $pass2) return humane.log("Ces mot de passes ne correspondent pas!");
		if($pass1.length<6) return humane.log("Votre nouveau mot de passe est trop court! (<7 caractères)");
		$.post("api/changepassword/"+$pass1+"/"+$pass2,function(res){
			var res = JSON.parse(res);
			if(res.code == "401")
				humane.log("Une erreur s'est produite, vérifier les permissions d'écriture du fichier config/options.json");
			else if(res.code == "600")
				humane.log(res.message);
			if(res.code == "200"){
				$("#pane-4").toggleClass("pane-password");
				humane.log("Votre mot de passe vient d'être changé!");
			}
		});
	})
});

function GAMESYNC(){
	this.online = true;
}
GAMESYNC.prototype.refreshMod = function(){
	$.get("api/mods",function(data){
		var mods = JSON.parse(data);
		$("#mod-list").html("");
		for(var i in mods)
			$("#mod-list").append("<li title='"+mods[i]+"'>"+ls.properListItem(mods[i])+"<a href='#' class='delete-mod' data-mod='"+mods[i]+"'><i class='fa fa-times'></i></a></li>")
	});
};
GAMESYNC.prototype.deleteMod = function(mod){
	$.ajax({
	  method: "DELETE",
	  url: "api/mods/"+mod
	}).done(function(data){
		var response = JSON.parse(data);
		if(response.code == "401")
			humane.log("Une erreur s'est produite, vérifier les permissions d'écriture du dossier mods");
		else 
			ls.refreshMod();
	});
};
GAMESYNC.prototype.refreshWhitelist = function(){
	$.get("api/whitelist",function(data){
		var whitelists = JSON.parse(data);
		$("#white-list").html("");
		for(var i in whitelists)
			$("#white-list").append("<li title='"+whitelists[i]+"'>"+ls.properListItem(whitelists[i])+"<a href='#' class='delete-whitelist' data-whitelist='"+whitelists[i]+"'><i class='fa fa-times'></i></a></li>")
	});
};
GAMESYNC.prototype.addWhitelist = function(entry){
	$.post("api/whitelist/"+entry,function(data){
		$("#whitelist").val("");
		ls.refreshWhitelist();
	});
};
GAMESYNC.prototype.properListItem = function(str){
	return (str.length>40)?str.substring(0,37)+"...":str;
}
GAMESYNC.prototype.deleteWhitelist = function(whitelist){
	$.ajax({
	  method: "DELETE",
	  url: "api/whitelist/"+whitelist
	}).done(function(data){
		var res = JSON.parse(data);
		if(res.code == "401")
			humane.log("Une erreur s'est produite, vérifier les permissions d'écriture du fichier config/options.json");
		else 
			ls.refreshWhitelist();
	});
};
GAMESYNC.prototype.refreshStatus = function(){
	$.get("api/status",function(data){
		data = JSON.parse(data);
		ls.online = (data == true);
		if(data == true){
			$(".hero").html("GameSync est en ligne");
			$("#pane-1").removeClass("offline");
			$("#maintenance").html("Activer la maintenance");
		}else{
			$(".hero").html("GameSync est hors ligne");
			$("#pane-1").addClass("offline");
			$("#maintenance").html("Désactiver la maintenance");
		}
	});
};
GAMESYNC.prototype.refreshAll = function(){
	this.refreshStatus();
	this.refreshMod();
	this.refreshWhitelist();
}