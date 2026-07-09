const date = new Date(), year = date.getFullYear();
document.getElementById('copyright').innerHTML = '&#169;' + year + ' moenaigomi.com.';

function copy() {
	let copyText = document.querySelector("#direct-url");
	copyText.select();
	document.execCommand("copy");
}
document.querySelector("#copy").addEventListener("click", copy);


$(function() {
	$('#submit').click(function() {
		let url, id, img;
		function escapeHTML(val) {
			return $('<div>').text(val).html();
		};

		url = encodeURI( $('#shared-url').val() );
		if ( url.indexOf( 'drive.google.com', 0 ) == -1 ) {
			alert( 'Google DriveのURLではありません' );
			return false;
		}

		id  = url.match(/(^.+?)(file|open)(\/d\/|\?id=)(.+?)(\/.+?)?$/);
		img = 'https://drive.google.com/uc?export=view&id=' + id[4];
		$('#direct-url').val(img);
		$('#preview-image img').remove();
		$('#preview-image').append('<img style="width: 200px;" class="img-thumbnail" src="' + img + '" alt="">');
	});
});