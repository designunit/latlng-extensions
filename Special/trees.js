importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '60df35cf1f491500087f6f76'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
	['tree', 'Дерево'],
])
const buttonLabel = new Map([
	['tree', 'Добавить'],
])
const colors = new Map([
	['tree', '#4DCCBD'],
])

setup(async () => {
	// const layerId = await requestLayer({
	// 	geometryTypes: ['Point']
	// })
	return {
		name: 'Trees',
		version: '1.0.0',
		description: 'survey',
		// options: {
		// 	layerId,
		// }
	}
})

on('install', async event => {
	overlay([
		// ['@', 'top-left', [
		//     ['button', { icon: 'arrow-left', href: PERMALINK }],
		//     // ['html', {
		//     //     html: '<a style="background:white;padding:2px 5px;" href="https://берегурай.рф">← на сайт берегурай.рф</a>',
		//     // }],
		// ]],
		// ['@', 'top-center', [
		//     ['html', { html: '<h1 style="margin:0;">ПИТКЯРАНТА</h1>' }],
		// ]],
		['@', 'right-center', [
			['button', { icon: 'question', command: 'ShowHelp' }],
		]],
	])

	//showHelp()
})

on('idle', async event => {
	await toolbar([
		['AddTree', {
			label: buttonLabel.get('tree'),
			// icon: 'like',
			color: colors.get('tree'),
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
	const name = feature.properties['Name']
	if (name) {
		return mdToHtml(`## ${name}`)
	}

	const type = feature.properties['type']
	if (!type) {
		return null
	}

	const title = typeLabel.get(type)
	const comment = feature.properties['comment']

	return mdToHtml([
		`## ${title}`,
		comment
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

	await showMapPopup(feature.geometry.coordinates, ['html', {
		html, style: {
			padding: 16,
		}
	}])
})

command('AddTree', async ctx => {
	return AddFeature({
		type: 'tree',
		title: buttonLabel.get('tree'),
		placeholder: 'Расскажите свою историю...',
		label: 'Комментарий',
		categories: [],
	})
})

command("ShowHelp", () => {
	showHelp()
})

async function showHelp() {
	const html = mdToHtml(`
        # Trees
    `)
	await showPopup([
		['html', { html }]
	], {
		title: 'Help',
		submit: 'Got it',
	})
}

async function AddFeature({ type, title, placeholder, label, categories }) {
	const mobile = await requestState('layout.mobile')
	const info = mobile
		? 'Добавте точку на карте'
		: 'Добавте точку на карте'
	const info2 = mobile
		? 'Наведите перекрестие и нажмите ОК'
		: 'Кликните по карте'
	const coord = await requestPoint(info2, info)
	// const coord = await requestPoint('Кликни по карте', 'что-то произойдет')

	// const before = !categories ? [] : [
	//     ['category', ['select', { label: 'Категория' },
	//         categories.map(value => ['option', { value }])
	//     ]]
	// ]
	const form = await requestInput([
		['wood', ['select', {
			required: true,
			label: 'Порода',
			mode: 'tags',
		}, [trees.map(
			value => ['option', { value }])
			]]],
		['trunk_diameter', ['input', {
			required: true,
			label: 'Обхват ствола (см)',
		}]],
		['height', ['input', {
			required: true,
			label: 'Высота (м)',
		}]],
		['crown_diameter', ['input', {
			required: true,
			label: 'Диаметр кроны (м)',
		}]],
		['condition', ['select', {
			required: true,
			label: 'Состояние',
			mode: 'single',
		}, [
				['option', { value: 'Удовлетворительное' }],
				['option', { value: 'Неудовлетворительное' }],
			],
		]],
		['trunk_support', ['select', {
			required: true,
			label: 'Наличие подпорки',
			mode: 'single',
		}, [
				['option', { value: 'Есть' }],
				['option', { value: 'Нет' }],
			],
		]],
		['ground', ['select', {
			required: true,
			label: 'Тип поверхности, в которое посажено дерево',
			mode: 'tags',
		}, [
				['option', { value: 'газон' }],
				['option', { value: 'асфальт' }],
				['option', { value: 'плитка' }],
			],
		]],
		['comment', ['text', {
			label: 'Комментарий',
			required: false,
			rows: 6,
		}]],
	], {
		title,
		submit: 'Добавить',
		cancel: 'Отмена',
	})

	const date = new Date()
	const properties = {
		comment: form.comment,
		// category: form.category,
		// contact: form.contact,
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
		layerId: LAYER_ID,
	})
}

const trees = [
	'АБРИКОС',
	'АКАЦИЯ',
	'АЙВА ЯПОНСКАЯ',
	'АРОНИЯ',
	'БАГРЯННИК',
	'БАРБАРИС',
	'БЕРЕЗА',
	'Береза бородавчатая или повислая',
	'Береза бумажная',
	'Береза вишневая',
	'Береза далекарлийкая',
	'Береза черная',
	'Береза американская',
	'Береза мелколистная',
	'Береза полезная',
	'Береза пушистая',
	'Береза ребристая, ',
	'Береза шерстистая',
	'Береза Эрмана',
	'БОБОВНИК',
	'БОЯРЫШНИК',
	'Боярышник алмаатинский',
	'БУЗИНА',
	'БУК',
	'ВИШНЯ',
	'ВЯЗ',
	'Вяз английский',
	'Вяз Андросова',
	'Вяз гладкий',
	'Вяз граболистный',
	'Вяз густой ',
	'Вяз лопастной',
	'Вяз перистоветвистый',
	'Вяз приземистый',
	'Вяз сродный',
	'Вяз шершавый',
	'ГИНКГО',
	'ГЛЕДИЧИЯ',
	'ГЛИЦИНИЯ',
	'ГРАБ',
	'ГРУША',
	'ДУБ',
	'Дуб белый',
	'Дуб болотный',
	'Дуб иволистный',
	'Дуб каменный',
	'Дуб каштанолистный',
	'Дуб красный или северный',
	'Дуб крупноплодный',
	'Дуб крупнопыльниковый',
	'Дуб монгольский',
	'Дуб пробковый',
	'Дуб пушистый',
	'Дуб скальный',
	'Дуб черешчатый',
	'ЗЕМЛЯНИЧНОЕ ДЕРЕВО',
	'ИВА',
	'Ива Бэбба',
	'Ива белая',
	'Ива вавилонская',
	'Ива волчникова',
	'Ива изящнейшая',
	'Ива кангинская',
	'Ива каспийская',
	'Ива козья',
	'Ива ломкая',
	'Ива Матсуды',
	'Ива мохнатая',
	'Ива остролистная',
	'Ива ползучая',
	'Ива прутовидная',
	'Ива пурпурная',
	'Ива пятитычинковая',
	'Ива росистая',
	'Ива ушастая',
	'Ива узколистная',
	'Ива цельнолистная',
	'Ива удская',
	'КАЛЬМИЯ',
	'КАРКАС',
	'КАТАЛЬПА',
	'КАШТАН',
	'Каштан американский',
	'Каштан японский',
	'Каштан европейский',
	'КЛЕН',
	'Клен бородатый',
	'Клен Гиннала',
	'Клен голый',
	'Клен желтый',
	'Клен голый ',
	'Клен завитой',
	'Клен зеленокорый',
	'Клен колосистый',
	'Клен ложнозибольдов',
	'Клен красный',
	'Клен ложноплатановый',
	'Клен маньчжурский',
	'Клен мелколистный',
	'Клен остролистный',
	'Клен пенсильванский',
	'Клен полевой',
	'Клен расходящийся',
	'Клен сахарный',
	'Клен Семенова',
	'Клен серебристый',
	'Клен татарский',
	'Клен черный',
	'Клен ясенелистный',
	'КОНСКИЙ КАШТАН',
	'КРУШИНА',
	'ЛЕЩИНА',
	'ЛИМОННИК',
	'ЛИПА',
	'Липа американская',
	'Липа амурская',
	'Липа войлочная',
	'Липа европейская',
	'Липа кавказская',
	'Липа крупнолистная',
	'Липа Максимовича',
	'Липа маньчжурская',
	'Липа мелколистная',
	'Липа обыкновенная',
	'Липа опушенностолбиковая',
	'Липа островная',
	'Липа сибирская',
	'Липа Таке',
	'Липа темно-зеленая',
	'Липа японская',
	'ЛИРИОДЕНДРОН',
	'ЛОХ',
	'МАГНОЛИЯ',
	'МИНДАЛЬ',
	'МИРТ',
	'ОБЛЕПИХА',
	'ОЛЬХА',
	'ОРЕХ',
	'Орех грецкий',
	'Орех Зибольда',
	'Орех маньчжурский',
	'Орех серый',
	'Орех черный',
	'Орех Хиндса',
	'Орех Ланкастерский',
	'ПАВЛОВНИЯ',
	'ПЛАТАН',
	'Платан восточный или Чинар',
	'Платан западный',
	'Платан кленолистный или лондонский',
	'РОБИНИЯ ',
	'РЯБИНА',
	'СИРЕНЬ',
	'СЛИВА',
	'СОФОРА',
	'ТОПОЛЬ',
	'Тополь бальзамический',
	'Тополь белый',
	'Тополь берлинский',
	'Тополь Болле',
	'Тополь волосистоплодный',
	'Тополь генероза',
	'Тополь дельтовидный',
	'Тополь душистый',
	'Тополь ивантеевский',
	'Тополь канадский',
	'Тополь Комарова',
	'Тополь корейский',
	'Тополь крупнолистный',
	'Тополь Симона',
	'Тополь лавролистный',
	'Тополь Максимовича',
	'Тополь московский',
	'Тополь осинообразный',
	'Тополь пирамидальный',
	'Тополь советский пирамидальный',
	'Тополь черный',
	'Тополь Яблокова',
	'ОСИНА',
	'ЧЕРЕМУХА',
	'ЖАСМИН',
	'ШЕЛКОВИЦА',
	'ЯБЛОНЯ',
	'ЯСЕНЬ',
	'Ясень американский',
	'Ясень белый',
	'Ясень ланцетный',
	'Ясень обыкновенный',
	'Ясень пушистый',
	'Ясень узколистный',
	'Ясень билтморейский',
	'Ясень Бунге',
	'Ясень сплошь волосистый',
	'Ясень маньчжурский',
	'Ясень черный',
	'Ясень орегонский',
	'Ясень остроплодный',
	'Ясень четырехгранный',
	'Ясень носолистный',
	'Ясень согдианский',
	'Ясень сирийский',
	'Ясень войлочный',
	'Ясень бархатный голый',
]
