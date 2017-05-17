//process.stdin.resume();

var nightmare = require('nightmare')({
	show: false
})
var fs = require('fs')
var data = []
var alphabet = 'becdfghijklmnopqrstuvwxyz'.split('')
var searches = alphabet.map(l => l + ',')
var counter = 0;

function lookUp(nightmare, search) {
	console.log(search, searches.length)
	nightmare
		.evaluate(search => {
			$('#SearchString').val(search)
		}, search)
		.click('#submitButton')
		.wait(400)
		.evaluate(() => {
			var html = $('.students > div:last-child').html()
			switch (html.length) {
				case 50: // None
					return {
						status: 'none'
					};
				case 65: // Too many
					return {
						status: 'many'
					};
				default:
					return {
						status: 'good',
						arr: html.match(/href[\w\W]*?&/g).map(str => {
							var match = str.match(/>(.+?)<[\S\s]*>(.+) &/)
							return {
								name: match[1],
								home: match[2],
								email: str.slice(25, 33)
							}
						})
					}
			}
		})
		.then(result => {
			if (result.status == 'many') { // then we need to be more specific
				counter = 0
				searches = alphabet.map(a => search + a).concat(searches)
			} else if (result.status == 'good') { // then append our results
				counter += result.length;
				data = data.concat(result.arr)
			} else if (search[search.length - 1] == alphabet[alphabet.length - 1] && counter < 20) {
				console.log(search[search.length - 1], alphabet[alphabet.length - 1])
				// for cases when we need to have a more specific last name
				counter = 0
				search.pop()
				searches = alphabet.map(a => search.replace(',', a + ',')).concat(searches)
			}
			// go to next, if there is one
			if (searches.length) {
				lookUp(nightmare, searches.shift())
			} else {
				save()
			}
		})
		.catch(save)
}

function save() {
	fs.writeFileSync('result2.json', JSON.stringify(data))
}

nightmare
	.goto('https://web.byui.edu/directory/students/')
	.click('#submitButton')
	.wait(1000)
lookUp(nightmare, searches.shift())

//process.on('SIGINT', save);
//process.on('uncaughtException', save);
