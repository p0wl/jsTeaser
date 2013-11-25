/** JS PORT OF PYTEASER **/
var _ = require('underscore');

var jsTeaser = (function () {

	var that = {};

	var stopWords = ["-", " ", ",", ".", "a", "e", "i", "o", "u", "t", "about", "above", "above", "across", "after", "afterwards", "again", "against", "all", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "amoungst", "amount", "an", "and", "another", "any", "anyhow", "anyone", "anything", "anyway", "anywhere", "are", "around", "as", "at", "back", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "below", "beside", "besides", "between", "beyond", "both", "bottom", "but", "by", "call", "can", "cannot", "can't", "co", "con", "could", "couldn't", "de", "describe", "detail", "did", "do", "done", "down", "due", "during", "each", "eg", "eight", "either", "eleven", "else", "elsewhere", "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fifty", "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", "front", "full", "further", "get", "give", "go", "got", "had", "has", "hasnt", "have", "he", "hence", "her", "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", "however", "hundred", "i", "ie", "if", "in", "inc", "indeed", "into", "is", "it", "its", "it's", "itself", "just", "keep", "last", "latter", "latterly", "least", "less", "like", "ltd", "made", "make", "many", "may", "me", "meanwhile", "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", "name", "namely", "neither", "never", "nevertheless", "new", "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own", "part", "people", "per", "perhaps", "please", "put", "rather", "re", "said", "same", "see", "seem", "seemed", "seeming", "seems", "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere", "still", "such", "take", "ten", "than", "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this", "those", "though", "three", "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve", "twenty", "two", "un", "under", "until", "up", "upon", "us", "use", "very", "via", "want", "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves", "the", "reuters", "news", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "mon", "tue", "wed", "thu", "fri", "sat", "sun", "rappler", "rapplercom", "inquirer", "yahoo", "home", "sports", "1", "10", "2012", "sa", "says", "tweet", "pm", "home", "homepage", "sports", "section", "newsinfo", "stories", "story", "photo", "2013", "na", "ng", "ang", "year", "years", "percent", "ko", "ako", "yung", "yun", "2", "3", "4", "5", "6", "7", "8", "9", "0", "time", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "philippine", "government", "police", "manila"];
	var ideal = 20;

	that.summarize = function (title, text) {
		title = title.toLowerCase();
		text = text.toLowerCase();

		var summaries = [];
	

		var sentences = splitSentences(text);	

		var keys = keywords(text);
		var titleWords = splitWords(title);

		var ranks = score(sentences, titleWords, keys);
		summaries = _.chain(ranks)
					.sortBy(function (x) { return Number(-x.score) || 0; })
					.pluck('sentence')
					.first(5)
					.value();

		return summaries;
	}

	var score = function(sentences, titleWords, keywords) {
		// score sentences based on different features

		var senSize = sentences.length;
		var ranks = [];

		for (var i = 0; i < sentences.length; i++)
		{
			var s = sentences[i];
			var sentence = splitWords(s);
			var titleFeature = titleScore(titleWords, sentence);
			var sentenceLength = lengthScore(sentence);
			var sentencePositionVar = sentencePosition(i+1, senSize);
			var sbsFeature = sbs(sentence, keywords);
			var dbsFeature = dbs(sentence, keywords);
			var frequency = (sbsFeature + dbsFeature) / 2.0 * 10.0;

			//weighted average of scores from four categories
			totalScore = (titleFeature*1.5 + frequency*2.0 + sentenceLength*1.0 + sentencePositionVar*1.0)/4.0;

			/*
			console.log('-------------------------------');
			console.log('SENTENCE: ' + s);
			console.log('titleFeature: ' + titleFeature + '	sentenceLength: ' + sentenceLength + '	sentencePositionVar: ' + sentencePositionVar+ '	sbsFeature: ' + sbsFeature + '	dbsFeature: ' + dbsFeature + '	frequency: ' + frequency);
			console.log('TOTAL SCORE: ' + totalScore);
			*/
			ranks.push({sentence: s, score: totalScore});
		}
		return ranks;
	}

	var sbs = function(words, keywords)	{
		var score = 0.0;
		if (words.length == 0) return 0;

		words.forEach(function (word) {
			score += getWordCount(word, keywords);
		});

		return (1.0 / Math.abs(words.length) * score) / 10.0;
	}

	var dbs = function(words, keywords) {
		if (words.length == 0) { return 0 };

		var summ = 0;
		var first = null;
		var second = {};

		for (var i = 0; i < words.length; i++)
		{
			var word = words[i];
			var score = getWordCount(word, keywords);
			if (score > 0) {
				if (first === null) {
					first = {num: i, score: score};

				} else {
					second = first;
					first = {num: i, score: score};
					dif = first.num - second.num;
					summ += (first.score*second.score) / Math.pow(dif, 2);
				}
			}
		}
		// TODO: Translate better: var k = len(set(keywords.keys()).intersection(set(words)))+1 //number of intersections
		var k = _.intersection(_.chain(keywords).pluck('word').toArray().value(),words).length + 1;
		return (1/(k*(k+1.0))*summ);
	}

	var splitWords = function (text) {
		var reg = /[^\w ]/g;

		var text = text.replace(reg, '');
		return text.split(' ');
	}

	var keywords = function(text) {
		var text = splitWords(text);
		numWords = text.length;
		
		text = removeStopWords(text);

		keywords = mostCommon(text);

		_.chain(keywords).each(function (k) {
			var v = k.sum;
			var articleScore = v*1.0 / numWords;
			k.sum = articleScore * 1.5 + 1;
		});
		return keywords;
	}


	var splitSentences = function (text) {
		var reg = /\n/g;
		var sentences = text.replace(reg, '').split('.');
		return sentences;
	}

	var lengthScore = function(sentence) {
		return 1-Math.abs(ideal - sentence.length) / ideal;
	}

	var titleScore = function(title, sentence) {
		title = removeStopWords(title);
		sentence = removeStopWords(sentence);
		count = 0;
		_.each(sentence, function (word) {
			if (_.contains(title, word))
			{
				count += 1;
			}
		});

		return count / title.length;
	}

	var sentencePosition = function (i, size) {
		normalized =  i*1.0 / size
		if (normalized > 0 && normalized <= 0.1) {
			return 0.17;
		}
		if  (normalized > 0.1 && normalized <= 0.2) {
			return 0.23;
		}
		if (normalized > 0.2 && normalized <= 0.3) {
			return 0.14;
		}
		if (normalized > 0.3 && normalized <= 0.4) {
			return 0.08;
		}
		if (normalized > 0.4 && normalized <= 0.5) {
			return 0.05;
		}
		if (normalized > 0.5 && normalized <= 0.6) {
			return 0.04;
		}
		if (normalized > 0.6 && normalized <= 0.7) {
			return 0.06;
		}
		if (normalized > 0.7 && normalized <= 0.8) {
			return 0.04;
		}
		if (normalized > 0.8 && normalized <= 0.9) {
			return 0.04;
		}
		if (normalized > 0.9 && normalized <= 1.0) {
			return 0.15;
		}
		return 0;
	}


	/** HELPER **/
	var mostCommon = function (text, top) {

 		/** replacable by most common ?? **/
		var freq = [];
		text.forEach(function (word) {
			freq[word] = (freq[word] || 0) + 1;
		});

		var countKeys = _(freq).keys().length;
		var minSize = countKeys < 10 ? countKeys : 10;

		var res = [];
		_.chain(freq).keys().each(function (w) {
			res.push({word: w, sum: freq[w]});
		}).value();

		var ordered =  _.chain(res)
						.sortBy(function (w) {	return -w.sum; })
						.first(10)
						.value();

		return ordered;		
	}

	var removeStopWords = function (text) {
		return _.difference(text, stopWords);
	}

	var getWordCount = function (word, words) {
		var x = _.findWhere(words, {word: word});
		return x ? x.sum : 0;
	}

	return that;

})();

module.exports = jsTeaser;



var main = function () {

	//var result = jsTeaser.summarize('Twitters Forward Secrecy Takes Step To Make It Harder To Spy On Its Users', '(Reuters) - Twitter Inc said it has implemented a security technology that makes it harder to spy on its users and called on other Internet firms to do the same, as Web providers look to thwart spying by government intelligence agencies. The online messaging service, which began scrambling communications in 2011 using traditional HTTPS encryption, said on Friday it has added an advanced layer of protection for HTTPS known as "forward secrecy." "A year and a half ago, Twitter was first served completely over HTTPS," the company said in a blog posting. "Since then, it has become clearer and clearer how important that step was to protecting our users privacy." Twitters move is the latest response from U.S. Internet firms following disclosures by former spy agency contractor Edward Snowden about widespread, classified U.S. government surveillance programs. Facebook Inc, Google Inc, Microsoft Corp and Yahoo Inc have publicly complained that the government does not let them disclose data collection efforts. Some have adopted new privacy technologies to better secure user data. Forward secrecy prevents attackers from exploiting one potential weakness in HTTPS, which is that large quantities of data can be unscrambled if spies are able to steal a single private "key" that is then used to encrypt all the data, said Dan Kaminsky, a well-known Internet security expert. The more advanced technique repeatedly creates individual keys as new communications sessions are opened, making it impossible to use a master key to decrypt them, Kaminsky said. "It is a good thing to do," he said. "Im glad this is the direction the industry is taking."');
	var result = jsTeaser.summarize('Framework for Partitioning and Execution of Data Stream Applications in Mobile Cloud Computing', 'The contribution of cloud computing and mobile computing technologies lead to the newly emerging mobile cloud com- puting paradigm. Three major approaches have been pro- posed for mobile cloud applications: 1) extending the access to cloud services to mobile devices; 2) enabling mobile de- vices to work collaboratively as cloud resource providers; 3) augmenting the execution of mobile applications on portable devices using cloud resources. In this paper, we focus on the third approach in supporting mobile data stream applica- tions. More specifically, we study how to optimize the com- putation partitioning of a data stream application between mobile and cloud to achieve maximum speed/throughput in processing the streaming data. To the best of our knowledge, it is the first work to study the partitioning problem for mobile data stream applica- tions, where the optimization is placed on achieving high throughput of processing the streaming data rather than minimizing the makespan of executions as in other appli- cations. We first propose a framework to provide runtime support for the dynamic computation partitioning and exe- cution of the application. Different from existing works, the framework not only allows the dynamic partitioning for a single user but also supports the sharing of computation in- stances among multiple users in the cloud to achieve efficient utilization of the underlying cloud resources. Meanwhile, the framework has better scalability because it is designed on the elastic cloud fabrics. Based on the framework, we design a genetic algorithm for optimal computation parti- tion. Both numerical evaluation and real world experiment have been performed, and the results show that the par- titioned application can achieve at least two times better performance in terms of throughput than the application without partitioning.');
	console.log(result);
}

main();