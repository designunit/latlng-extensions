importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '5f79ced1e4cf7f5235dc6f16'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
    ['idea', 'Идея'],
    ['badview', 'Плохой вид на воду'],
    ['goodview', 'Хороший вид на воду'],
])
const buttonLabel = new Map([
    ['idea', 'Предложить территории'],
    ['badview', 'Плохой вид на воду'],
    ['goodview', 'Хороший вид на воду'],
])

const colors = new Map([
    ['idea', '#FFD166'],
    ['goodview', '#4DCCBD'],
    ['badview', '#F25C63'],
])

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'Murmansk',
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

    showHelp()
})

on('idle', async event => {
    await toolbar([
        ['AddIdea', {
            label: buttonLabel.get('idea'),
            icon: 'bulb',
            color: colors.get('idea'),
        }],
        ['AddGoodView', {
            label: buttonLabel.get('goodview'),
            icon: 'like',
            color: colors.get('goodview'),
        }],
        ['AddBadView', {
            label: buttonLabel.get('badview'),
            icon: 'dislike',
            color: colors.get('badview'),
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
    if(name){
        return mdToHtml(`## ${name}`)
    }

    const type = feature.properties['type']
    if(!type){
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
    if(!html) {
        return
    }

    await showMapPopup(feature.geometry.coordinates, ['html', {
        html, style: {
            padding: 16,
        }
    }])
})

command("AddIdea", async ctx => {
    return AddFeature({
        type: 'idea',
        title: buttonLabel.get('idea'),
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

command("AddBadView", async ctx => {
    return AddFeature({
        type: 'badview',
        title: buttonLabel.get('badview'),
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

command("AddGoodView", async ctx => {
    return AddFeature({
        type: 'goodview',
        title: buttonLabel.get('goodview'),
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
    const icon_base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAFRElEQVRoBdVaS2wTRxj+7SQlJThSnbYpUsuJNLZUEoUIA31IcAMJidwcFeRwaIMQHADBASGhqGeU5gRF7SUWquoL4sCl4uBIrVrbiCKLg1PBAdFDG1qCcIhSmsf2+9a76/F612+w/a8+z8w///yPndmdx9ojDSBNtHehZj+wFxgEtgNvAT6AtAQ8Ax4C80ACiHvE8wRpcwhO+4FTQBLQagTbUof/tUUBY1uBaWAZqNVxezvqos6trywQKO8CzgMvALsDjSpTN210NTQQKBwAfgMa5Wg5PbQ10JAgoGgMyL5G583gaHOsriCgYBJYa4LzZhC0PVlTEIbzpqJmp9UFAec5bJp55+03jL44DiePvXsgyIfnLmBOQnaRZpU5GY5i8nugOuBVC3Cer68Y0GrO0036FDN8ZFmnggDAOQ2M5Kpa8pe+0UeLrCGEyDgLsnt6rNoKM4sdizL13pQkehKy5GVPF5Nvwyd7lvfI1F9T4l+va+WwDO0DGEp/0oraA+dRrtr5Vc+qnHz/pNz23XZ1noYYGGUoyzZ1EH2kr3nC3efCrKa1zZW3r2iBQEA7EDigPZp7hKnamVh3MHBQl2Ub2KsH9DXfjShwRVi1wqw3q4U+DOlOJb5JOHuucCnDYNmGbWuxqbQ5xS7QnwEwk8iH8n1SnJvbMiez/lm5331f1jxrso5rw7MhvHa9sUui6WhxIwdOZDgid/67g7GLS/NKB65OrVN2/LtDJhYnZN+LfQ6tHFkpPAe7PXCem5EFRxGDOfPOjFzru+YqMnt2VkJflozfapv6NiUT0xNW2Z45/vS4nP674EVjF1HL/YIAwkq3FHVrfEtc7/ahwSEt+kVUe/74uTIoGpOlTuqmDQ4x2izlk1IXZgAzCqOo4bFtx3SlNPCqiTYYAG2W8kmpm+FrlHtYV0p3p/W6w5cO6+mRoSNydOioo/zq8qpcn7wu4x+Ny2hgVAfz5LGuHJk27r15r5yoWT/YiRw34K7EB5XU+0GvqwwrFtILcuLzE5LZyOTkjCkyvZ6W9E9puRG6IVe/vyr9w/2uekwbLz0vXWVsFdv5EP8DZp+twiruHNwpK54VyWQMx6yafIZ3NxwK553PVxXkgt6gxFIx6epx3zEGg0G9TWbe3Z6i9CmHUN0Lt9iZmOV8F9aDFz65IMkfkzqYJ4/E3qFsA8mnLiVq1nvrl1tW23OfnpPIdxHp3darg3nyTFJlTV49KQNwXn1VofXBWn6JPnapeN+h8lTZKky4iS4xAJ6YtSs9YwA87quLBjq5icvRza9umlkrVXmqrCVQe+YhA/i99va5loc+PmSpuPzzZcGEJNnHWR3Mk2eSKmvy6kjn+RoNQ8EPbkpa/DU6zh6IuzlfKZ/vdU5SfM+7EesoU2oOcGtbgh/3GkfcKTchLnlJ2T+ybiI6nzMsJ6mLn12U4Y5h2axt1sE8eawrNQvrNjDsSN1at56W+eFyOnc8j2HkuqFp4cWcvqHRg0QArlvKFl1OW1tK9VRiGtGcceq2chsapza18irc0HyN4XOWNtQASh6rcEsZ9UetLSUbo+eYuKam9nJym7RNMrIyUumWsuBYRXfA/IEhflyodDPRLLmCIxWrB4w7yWVjEmjV0znudHZj+Fi7o4IAjCC4LrgL1L3Mpr4GUvnDXRpDdFxaRoB1lluE6EvE8K0yl/As8OtMs8a53W51HzjMEI0gmvmho/ZPTEoQ7fuRTwmifT+zKkG074duMwimeC7a868GahBGIH0Ipul/9iiayOyOVlJGIDzh3g/sBcr93YZb2F+Bhvzd5n94I1tRPskjPgAAAABJRU5ErkJggg=='
    const img = `<img width="24" height="24" src="${icon_base64}" />`
    const html = `
<h1>#МОЙЗАЛИВ</h1>

<p>
Это пилотный проект по выявлению и преображению городских территорий с видом на залив. Сейчас мы прорабатываем 12 тестовых видовых площадок ${img}.
</p>

<p>
Если у вас есть идеи какой должен быть вид на залив - укажите точку на карте и напишите свой комментарий во всплывающем окне.
</p>

<p>
Красивые виды – это уникальность нашего города, давайте возвращать эти виды себе и любоваться вместе!
</p>
	`

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
        ['contact', ['input', {
            label: 'Присоединяйтесь к проекту, оставьте ваши имя, e-mail, телефон или социальные сети (по желанию)',
            placeholder: 'имя, e-mail, телефон, соцсети',
            // pattern: {
            //        value: /^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})?$/i,
            //        message: "invalid email address"
            //    }
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
        contact: form.contact,
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

