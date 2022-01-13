async function paintPath(path) {
    alert('Путь: ' + path)
    for (let i = 0; i < path.length - 1; i++) {
        let curve = layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) !== undefined ?
            layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) :
            layer.findOne(`#line_${path[i + 1]}_${path[i]}_${nodes.get(path[i + 1]).get(path[i]).length - 1}`)
        curve.stroke('red')
    }

    await new Promise(resolve => setTimeout(resolve, 500))
    let save = confirm("Сохранить путь?")

    if (save) {
        let handle = await window.showSaveFilePicker()
        let stream = await handle.createWritable()
        await stream.write(path)
        await stream.close()
    }
}

function returnDefaultPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
        let curve = layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) !== undefined ?
            layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) :
            layer.findOne(`#line_${path[i + 1]}_${path[i]}_${nodes.get(path[i + 1]).get(path[i]).length - 1}`)
        curve.stroke('blue')
    }
}

function addTask(procedure) {
    let start = parseInt(prompt("Введите начальную вершину", '0'))
    let end = parseInt(prompt("Введите конечную вершину", '0'))
    let path = procedure(start, end)

    addHistoryCommand({
        undo: () => {
            returnDefaultPath(path)
        },
        redo: () => {
            paintPath(path)
        }
    }).redo()
}

function bfs(start, end) {
    let queue = [], visited = [], d = [Array(nodes.size).fill(0)], p = [Array(nodes.size).fill(0)]
    queue.push(start)
    visited.push(start)
    p[start] = -1

    while(queue.length > 0) {
        let v = queue.shift()

        for(let neighbor of nodes.get(v).keys()) {
            if(!visited.includes(neighbor)) {
                queue.push(neighbor)
                visited.push(neighbor)
                d[neighbor] = d[neighbor] + 1
                p[neighbor] = v
            }
        }
    }

    if (!visited.includes(end)) {
        alert(`От вершины ${start} нет пути до вершины ${end}`)
    } else {
        let path = []

        for (let i = end; i !== -1; i = p[i])
            path.push(i)

        path = path.reverse()
        return path
    }
}