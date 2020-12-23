importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '5fe35978dd79a05fefd48d54'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
    ['idea', 'Идея'],
    ['problem', 'Проблема'],
    ['nice', 'Ценность'],
])
const colors = new Map([
    ['idea', '#FFD166'],
    ['nice', '#4DCCBD'],
    ['problem', '#F25C63'],
])

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'Vtura',
        version: '0.0.1',
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
        ['@', 'top-center', [
            ['html', { html: '<h1 style="margin:0;">Верхняя Тура</h1>' }],
        ]],
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
            color: colors.get('idea'),
        }],
        ['AddNice', {
            label: 'Описать ценность',
            icon: 'like',
            color: colors.get('nice'),
        }],
        ['AddProblem', {
            label: 'Описать проблему',
            icon: 'dislike',
            color: colors.get('problem'),
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
        categories: [
            'Природа и река',
            'Доступная среда',
            'Отдых и досуг детей',
            'Отдых и досуг подростков',
            'Отдых и досуг старшего возраста',
            'Отдых и досуг взрослых',
            'Зимний досуг',
            'Туризм',
            'Культурные мероприятия',
            'Магазины и кафе',
            'Пешеходная инфраструктура',
            'Другое',
        ]
    })
})

command("AddProblem", async ctx => {
    return AddFeature({
        type: 'problem',
        title: 'Проблема',
        placeholder: 'Опишите проблему...',
        label: 'Комментарий',
        categories: [
            'Транспорт и дороги',
            'Мусор и загрязнение',
            'Доступная среда',
            'Площадки для отдыха',
            'Озеленение',
            'Безопасность',
            'Пешеходная инфраструктура',
            'Визуальный мусор',
            'Река',
            'Другое',
        ]
    })
})

command("AddNice", async ctx => {
    return AddFeature({
        type: 'nice',
        title: 'Ценность',
        placeholder: 'Расскажите свою историю...',
        label: 'Комментарий',
        categories: [
            'Природа и виды',
            'Воспоминания',
            'Значимые события',
            'Архитектура',
            'Любимые места',
            'Другое',
        ]
    })
})

command("ShowHelp", () => {
    showHelp()
})

async function showHelp() {
    const text = `
# Верхняя Тура

Поделиться своим мнением просто: выберите отметку идею, проблему или ценность, затем укажите точку на карте и напишите свой комментарий во всплывающем окне.

**Идеи и предложения**: Что может появиться на берегу Урая? Чего вам здесь не хватает?

**Проблемы**: Что вас беспокоит на реке и прибрежных территорий.

**Ценности**: Важные и любимые вами элементы, которые нужно сохранить или восстановить (исторические территории, интересные события, растительный и животный мир реки).
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
    const before = []
    const form = await requestInput([
        ...before,

        ['comment', ['text', {
            label,
            placeholder,
            required: 'Вы забыли оставить коментарий',
            rows: 12,
        }]],
        // ['contact', ['input', {
        //     label: 'Присоединяйтесь к проекту, оставьте ваши имя, e-mail, телефон или социальные сети (по желанию)',
        //     placeholder: 'имя, e-mail, телефон, соцсети',
        //     // pattern: {
        //     //        value: /^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})?$/i,
        //     //        message: "invalid email address"
        //     //    }
        // }]],
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

