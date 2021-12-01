importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

//inbox source
const SOURCE_ID = '61a68f5a23f79b00092c3453'

const buttonLabel = new Map([
	['point', 'Добавить'],
])
const colors = new Map([
	['point', '#4DCCBD'],
])

setup(async () => {
	return {
		name: 'masterplan',
		version: '1.0.0',
		description: 'survey',
	}
})

on('install', async event => {
	// overlay([
	// 	['@', 'right-center', [
	// 		['button', { icon: 'question', command: 'ShowHelp' }],
	// 	]],
	// ])

	//showHelp()
})

on('idle', async event => {
    // const uid = await getUserId()
    // if(!uid){
    //     console.log('User is not authorized: do not show buttons')
    //     return
    // }

	await toolbar([
		['AddPoint', {
			label: buttonLabel.get('point'),
			// icon: 'like',
			color: colors.get('point'),
		}],
	], {
		foldedLabel: 'Добавить',
	})
})

function mdToHtml(text) {
	const md = new markdownit()
	const tp = new Typograf({ locale: ['ru', 'en-US'] })
	const raw = md.render(text)
	return tp.execute(raw)
}

function getFeaturePopupContent(feature) {
	const type = feature.properties['category']
	if (!type) {
		return null
	}

	const comment = feature.properties['comment']
	if (!comment) {
		return null
	}

	const title = type

	// const kv = [
	// 	['text', 'Высота (м)'],
	// ].map(([key, label]) => {
	// 	return `${label}: ${feature.properties[key]}`
	// })

	return mdToHtml([
		`## ${title}`,
		comment,
		// ...kv,
	].join('\n\n'))
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

	const html = getFeaturePopupContent(feature)
	if (!html) {
		return
	}

	// const kv = [
	// 	['wood',           'string', 'Порода'],
	// 	['trunk_diameter', 'number', 'Обхват ствола на высоте 130 см (см)'],
	// 	['height',         'number', 'Высота (м)'],
	// 	['crown_diameter', 'number', 'Диаметр кроны (м)'],
	// 	['condition',      'string', 'Состояние'],
	// 	['trunk_support',  'string', 'Наличие опоры'],
	// 	['ground',         'string', 'Тип поверхности, в которое посажено дерево'],
	// 	['image',          'image',  'Фотография'],
	// 	['user',           'string', 'Пользователь'],
	// ]
	// await showMapPopup(feature.geometry.coordinates, ['kv', {
	// 	data: kv
	// 		.filter(([key, kind, label]) => Boolean(feature.properties[key]))
	// 		.map(([key, kind, label]) => {
	// 			const value = feature.properties[key]

	// 			return {
	// 				key: label,
	// 				value,
	// 				kind,
	// 			}
	// 		})
	// }])
	await showMapPopup(feature.geometry.coordinates, ['html', {
		html, style: {
			padding: 16,
		}
	}])
})

command('AddPoint', async ctx => {
	return AddFeature({
		title: buttonLabel.get('point'),
	})
})

command("ShowHelp", () => {
	showHelp()
})

async function showHelp() {
	const html = mdToHtml(`
# Мастер-план

На карте можно предложить свои идеи и предложения по улучшению жизни в городе, или, наоборот, описать его актуальные проблемы. 

Поделиться своим мнением просто:

1. Нажмите кнопку "Добавить"
2. Укажите место на карте, к которому относится ваш комментарий
3. Выберите категорию вашего комментария: городская среда и озеленение, транспорт и дороги, экология и загрязнение, безопасность, жилье, социальная инфраструктура, образование, культура и сфера досуга, сохранение наследия и достопримечательности, работа
4. Напишите ваш комментарий

Количество отметок не ограничено. Чем больше жителей города выскажет свое мнение - тем более реализуемым и полезным для каждого жителя получится итоговый документ мастер-плана.
    `)
	await showPopup([
		['html', { html }]
	], {
		title: 'Help',
		submit: 'Got it',
	})
}

async function AddFeature({ title }) {
	const mobile = await requestState('layout.mobile')
	const info = mobile
		? 'Добавьте точку на карте'
		: 'Добавьте точку на карте'
	const info2 = mobile
		? 'Наведите перекрестие и нажмите ОК'
		: 'Кликните по карте'
	const coord = await requestPoint(info2, info)

	const form = await requestInput([
		['category', ['select', {
			required: true,
			label: 'Категория',
			mode: 'single',
		}, [
				['option', { value: 'транспорт и дороги' }],
				['option', { value: 'экология и загрязнение' }],
				['option', { value: 'городская среда и озеленение' }],
				['option', { value: 'социальная инфраструктура' }],
				['option', { value: 'работа' }],
				['option', { value: 'жилье' }],
				['option', { value: 'культура и сфера досуга' }],
				['option', { value: 'сохранение наследия и достопримечательности' }],
				['option', { value: 'безопасность' }],
				['option', { value: 'образование' }],
			]
		]],
		['comment', ['text', {
			required: false,
			label: 'Комментарий',
			rows: 6,
		}]],
	], {
		title,
		submit: 'Добавить',
		cancel: 'Отмена',
	})

    console.log('input:', form)

	const date = new Date()

	const properties = {
		dateAdded: date.toString(),

		comment: form.comment,
		category: form.category,
	}

    const user = await getUser()
    if(user) {
		properties.user = user.name
		properties.uid = user.id
    }

    // if(Array.isArray(form.photos) && form.photos.length > 0) {
    //     properties.image = form.photos[0].fileUrl
    //     properties.photos = form.photos
    // }

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
