importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const SOURCE_ID = '67294ca3a0d090292a5e4b97'

const typeLabel = new Map([
    ['idea', 'Идея'],
    ['problem', 'Проблема'],
    ['attraction', 'Ценность'],
])

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'Survey',
        version: '0.0.1',
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
    if (!featureId) {
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

    const tp = new Typograf({ locale: ['ru', 'en-US'] })
    const html = tp.execute(
        raw
    )

    await showMapPopup(feature.geometry.coordinates, ['html', {
        html, style: {
            padding: 16,
        }
    }])
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
        type: 'attraction',
        title: 'Ценность',
        placeholder: 'Расскажите свою историю...',
        label: 'Комментарий',
    })
})

command("ShowHelp", () => {
    showHelp()
})

async function showHelp() {
    const text = `
# Сбор предложений и идей жителей по вопросам развития Ивангорода

Расскажите, каким вы видите будущее Ивангорода. Результаты исследования лягут в основу предложений по развитию территории.
Сбор мнений проводится до 14 ноября 2024 года.
Поделиться своим мнением просто: выберите то, о чем вы хотите рассказать (идея, проблема или ценность), затем укажите точку на карте, заполните появившуюся короткую анкету и напишите свой комментарий во всплывающем окне. 
 
- Идеи и предложения: что может появиться на улице, чего здесь не хватает? 
- Проблемы: их важно обозначить. Не стесняйтесь, отмечайте главные. 
- Ценности: важные и любимые вами места, объекты или события, которые нужно сохранить или восстановить (исторические, культурные, уникальные). 

Мнение каждого важно, чтобы точно определить запросы жителей городского поселения Ивангород.
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

async function AddFeature({ type, title, placeholder, label }) {
    const mobile = await requestState('layout.mobile')
    const info = mobile
        ? 'Добавте точку на карте'
        : 'Добавте точку на карте'
    const info2 = mobile
        ? 'Наведите перекрестие и нажмите ОК'
        : 'Кликните по карте'
    const coord = await requestPoint(info2, info)
    // const coord = await requestPoint('Кликни по карте', 'что-то произойдет')

    // Пол
    //

    const age = [
        'до 17',
        'от 18 до 25',
        'от 26 до 35',
        'от 36 до 45',
        'от 46 до 60',
        'от 61',
    ]
    const district = [
        'К северу от Кингисеппского шоссе (район 1-й школы, Федюнинская, Госпитальная и др.)',
        'К югу от Кингисеппского шоссе (Гагарина, Садовая, Матросова и др.)',
        'Парусинка',
        'Другое',
    ]
    const gender = [
        'мужской',
        'женский',
    ]

    const form = await requestInput([
        ['age', ['select', { label: 'Ваш возраст' },
            age.map(value => ['option', { value }])
        ]],
        ['gender', ['select', { label: 'Ваш пол' },
            gender.map(value => ['option', { value }])
        ]],
        // ['chidren', ['select', { label: 'Наличие детей (до 18 лет)?' }, [
        //     ['option', { value: 'Есть' }],
        //     ['option', { value: 'Нет' }],
        // ]]],
        ['district', ['select', { label: 'Район проживания' },
            district.map(value => ['option', { value }])
        ]],
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

