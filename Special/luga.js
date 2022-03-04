importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const SOURCE_ID = '6221ee002f37090009d48679'

const typeLabel = new Map([
	['idea', 'Идея'],
	['problem', 'Проблема'],
	['nice', 'Ценность'],
])

setup(async () => {
	// const layerId = await requestLayer({
	// 	geometryTypes: ['Point']
	// })
	return {
	    name: 'Luga',
	    version: '1.0.0',
	    description: 'survey',
	    // options: {
	    // 	layerId,
	    // }
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

on('idle', async event => {
    await toolbar([
        ['AddIdea', {
        	label: 'Предложить идею',
        	icon: 'bulb',
        	color: '#FFD166',
        }],
        ['AddAttraction', {
        	label: 'Описать ценность',
        	icon: 'like',
        	color: '#4DCCBD',
        }],
        ['AddProblem', {
        	label: 'Описать проблему',
        	icon: 'dislike',
        	color: '#F25C63',
        }],
    ], {
    	foldedLabel: 'Добавить',
    })
})

on('feature.select', async event => {
	const featureId = event.data.featureId
	const layerId = event.data.layerId
	if(!featureId){
		return
	}
	
    const fc = await requestFeatures([featureId])
    
    const feature = fc.features[0]
    const geometryType = feature.geometry.type
    assert(geometryType !== 'Point', new Error('Selected feature is not a point'))
    
	const type = feature.properties['type']
    const title = typeLabel.get(type)
    const comment = feature.properties['comment']

    const md = new markdownit()
	const raw = md.render([
		`# ${title}`,
		comment
	].join('\n\n'));

    const tp = new Typograf({locale: ['ru', 'en-US']})
    const html = tp.execute(
    	raw
    )

	await showMapPopup(feature.geometry.coordinates, ['html', { html, style: {
		padding: 16,
	}}])
})

command("AddIdea", async ctx => {
	return AddFeature({
		type: 'idea',
		title: 'Идея',
		placeholder: 'Опишите свою идею...',
		label: 'Комментарий',
	})
})

command("AddProblem", async ctx => {
	return AddFeature({
		type: 'problem',
		title: 'Проблема',
		placeholder: 'Опишите проблему...',
		label: 'Комментарий',
	})
})

command("AddAttraction", async ctx => {
	return AddFeature({
		type: 'nice',
		title: 'Ценность',
		placeholder: 'Расскажите свою историю...',
		label: 'Комментарий',
	})
})

command("ShowHelp", () => {
	showHelp()
})

async function showHelp(){
	const text = `
# ЛУГА

Поделиться своим мнением просто: выберите отметку — идею, проблему или ценность, затем укажите точку на карте и напишите свой комментарий во всплывающем окне.

Идеи и предложения: Что может появиться в вашем городе? Чего здесь не хватает?

Проблемы: Обычно их много. И их важно обозначить. Не стесняйтесь, отмечайте главные.

Ценности: Важные и любимые вами места или элементы, которые нужно сохранить или восстановить (исторические территории, интересные события).
	`
	const md = new markdownit()
	const html = md.render(text)

	await showPopup([
		['html', { html }]
	], {
		title: 'Help',
		submit: 'Got it',
	})
}

async function AddFeature({type, title, placeholder, label}) {
	const mobile = await requestState('layout.mobile')
	const info = mobile
		? 'Добавте точку на карте'
		: 'Добавте точку на карте'
	const info2 = mobile
		? 'Наведите перекрестие и нажмите ОК'
		: 'Кликните по карте'
	const coord = await requestPoint(info2, info)
	// const coord = await requestPoint('Кликни по карте', 'что-то произойдет')

	const form = await requestInput([
        ['comment', ['text', {
        	label,
	        placeholder,
	        required: 'Вы забыли оставить коментарий',
        	rows: 12,
        }]],
        // ['email', ['input', {
        // 	label: 'EMAIL',
        // 	placeholder: 'Расскажите свою email...',
        // 	// pattern: {
        //  //        value: /^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})?$/i,
        //  //        message: "invalid email address"
        //  //    }
        // }]],
    ], {
    	title,
    	submit: 'Добавить',
    	cancel: 'Отмена',
    })

	const date = new Date()
    const properties = {
		comment: form.comment,
		dateAdded: date.toString(),
        type,
    }

	const f = {
		type: 'FeatureCollection',
		features: [
			{
	        	type: 'Feature',
		        geometry: {
		            type: 'Point',
		            coordinates: [coord.lng, coord.lat]
		        },
		        properties,
		    }
	    ]
	}

    await addFeatures(f, {
    	sourceId: SOURCE_ID,
    })
}

