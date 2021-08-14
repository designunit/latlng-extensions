importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

setup(async () => {
	return {
		name: 'Trees',
		version: '1.0.0',
		description: 'survey',
	}
})

on('install', async event => {
	overlay([
		['@', 'right-center', [
			['button', { icon: 'question', command: 'ShowHelp' }],
		]],
	])

	showHelp()
})

function mdToHtml(text) {
	const md = new markdownit()
	const tp = new Typograf({ locale: ['ru', 'en-US'] })
	const raw = md.render(text)
	return tp.execute(raw)
}

on('feature.select', async event => {
	const featureId = event.data.featureId
	const layerId = event.data.layerId
	if (!featureId) {
		return
	}

	const fc = await requestFeatures([featureId])

	const feature = fc.features[0]
	const geometryType = feature.geometry.type
	assert(geometryType !== 'Point', new Error('Selected feature is not a point'))

	const kv = [
		['wood',           'string', 'Порода'],
		['trunk_diameter', 'number', 'Обхват ствола (см)'],
		['height',         'number', 'Высота (м)'],
		['crown_diameter', 'number', 'Диаметр кроны (м)'],
		['condition',      'string', 'Состояние'],
		['trunk_support',  'string', 'Опора'],
		['ground',         'string', 'Поверхность'],
		['image',          'image',  'Фотография'],
	]
	await showMapPopup(feature.geometry.coordinates, ['kv', {
		data: kv
			.filter(([key, kind, label]) => Boolean(feature.properties[key]))
			.map(([key, kind, label]) => {
				const value = feature.properties[key]

				return {
					key: label,
					value,
					kind,
				}
			})
	}])
})

command("ShowHelp", () => {
	showHelp()
})

async function showHelp() {
	const html = mdToHtml(`
        # Посчитаем деревья в своем городе!

Теперь помочь посчитать деревья в своем городе может любой, у кого есть смартфон и 5 минут времени. 
 
В рамках программы "Зеленые города" разработано IT-решение для картирования и подсчета деревьев в 4 городах России: Санкт-Петербург, Краснодар, Саратов и Пермь. Если вы готовы присоединиться к нашему сообществу единомышленников - присылайте свою заявку на sfctrees@gmail.com с темой письма "волонтер_ название города_". 

"Зеленые города"  - международная программа обмена опытом и практиками об устойчивом развитии городов на основе кооперации, заботы и ответственности. Программа поддерживает озеленительные сообщества 4 российских городов Санкт-Петербург, Краснодар, Саратов и Пермь в целях расширения участия горожан/ок в создании зеленого каркаса с своих городах. Организаторы программы: Мосты, Mensch Raum Land E.V при поддержке МИД Германии
    `)
	await showPopup([
		['html', { html }]
	], {
		title: 'Help',
		submit: 'Got it',
	})
}
