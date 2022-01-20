function getCurve(from, to) {
    return layer.findOne(`#line_${from}_${to}_${nodes.get(from).get(to).length - 1}`) !== undefined ?
        layer.findOne(`#line_${from}_${to}_${nodes.get(from).get(to).length - 1}`) :
        layer.findOne(`#line_${to}_${from}_${nodes.get(from).get(to).length - 1}`)
}

function paintPath(path, isSaving = true, text) {
    alert(text + path)

    for (let i = 0; i < path.length - 1; i++) {
        let curve = getCurve(path[i], path[i + 1])
        curve.stroke('red')
    }

    if (isSaving)
        save(path, "Сохранить путь?")
}

function returnDefaultPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
        let curve = getCurve(path[i], path[i + 1])
        curve.stroke('blue')
    }
}

function paintCommand(path, isSaving = true, text = "Путь: ") {
    addHistoryCommand({
        undo: () => {
            returnDefaultPath(path)
        },
        redo: () => {
            paintPath(path, isSaving, text)
        }
    }).redo()
}

async function save(text, message) {
    await new Promise(resolve => setTimeout(resolve, 500))
    let save = confirm(message)

    if (save) {
        let handle = await window.showSaveFilePicker()
        let stream = await handle.createWritable()
        await stream.write(text)
        await stream.close()
    }
}

function getAdjMatrix() {
    let matrix = []
    for (let i = 1; i < trs.length; i++) {
        matrix.push([])
        for (let j = 1; j < trs[i].cells.length; j++) {
            matrix[i - 1].push(parseInt(trs[i].cells[j].textContent))
        }
    }

    return matrix
}

function getAdjLists() {
    let matrix = []
    for (let nodes1 of nodes.values()) {
        let list = []
        for (let node2 of nodes1.keys())
            list.push(node2)

        matrix.push(list)
    }

    return matrix
}

function getMapEdges(nodess) {
    let graph = new Map()
    for (let [node1, nodes1] of nodess) {
        graph.set(node1, [])
        for (let [node2, weights] of nodes1)
            graph.get(node1).push({
                to: node2,
                cost: weights[0]
            })
    }

    return graph
}

async function generate() {
    function randomInt(max) {
        return Math.floor(Math.random() * max)
    }

    let count = prompt("Введите количество вершин", "1")
    let matrix = Array(parseInt(count)).fill(0)

    for (let i = 0; i < count; i++)
        matrix[i] = Array(parseInt(count)).fill(0)

    for (let i = 0; i < count; i++)
        for (let j = i + 1; j < count; j++)
            if (randomInt(101) > 60) {
                matrix[i][j] = matrix[j][i] = 1
            }

    let handle = await window.showSaveFilePicker()
    let stream = await handle.createWritable()
    stream.write(" ")
    for (let i = 0; i < count; i++) {
        stream.write(" " + i)
    }

    stream.write("\r\n")

    for (let i = 0; i < matrix.length; i++) {
        stream.write(i)
        let text = ''
        for (let j = 0; j < matrix.length; j++) {
            text += " " + matrix[i][j]
        }

        stream.write(text)

        if (i !== matrix.length - 1)
            stream.write("\r\n")
    }

    stream.close()
}

function startEndPathPaint(procedure) {
    let start = prompt("Введите начальную вершину", '0')
    let end = prompt("Введите конечную вершину", '0')
    start = getId(start)
    end = getId(end)
    let path = procedure(start, end)

    if (path !== undefined)
        paintCommand(path)
}

function bfs(start, end) {
    let queue = [], visited = [], d = [Array(nodes.size).fill(0)], p = [Array(nodes.size).fill(0)]
    queue.push(start)
    visited.push(start)
    p[start] = -1

    while (queue.length > 0) {
        let v = queue.shift()
        for (let [neighbor, weight] of nodes.get(v)) {
            if (weight[0] !== 0 && !visited.includes(neighbor)) {
                queue.push(neighbor)
                visited.push(neighbor)
                d[neighbor] = d[neighbor] + 1
                p[neighbor] = v
            }
        }
    }

    if (!visited.includes(end)) {
        alert(`От вершины ${start} нет пути до вершины ${end}`)
        return undefined
    } else {
        let path = []
        for (let i = end; i !== -1; i = p[i])
            path.push(i)

        path = path.reverse()
        return path
    }
}

function dijkstra(start, nodes1 = nodes) {
    let d = Array(nodes1.size).fill(Number.MAX_VALUE), p = Array(nodes1.size), v = []
    d[start] = 0

    for (let i = 0; i < nodes1.size; i++) {
        let a = -1
        for (let j = 0; j < nodes1.size; j++) {
            if (!v.includes(j) && (a === -1 || d[j] < d[a]))
                a = j
        }

        if (d[a] === Number.MAX_VALUE)
            break

        v.push(a)
        for (let [to, len] of nodes1.get(a)) {
            to = parseInt(to)
            len = parseInt(len[0])

            if (len !== 0 && d[a] + len < d[to]) {
                d[to] = d[a] + len
                p[to] = a
            }
        }
    }

    for (let i = 0; i < d.length; i++)
        if (d[i] === Number.MAX_VALUE)
            d[i] = -1

    return d
    /*let path = []

    for (let i = 1; i !== start; i = p[i]) {
        path.push(i)
    }

    path.push(start)
    path.reverse()

    return path*/
}

function task4() {
    let start = parseInt(prompt("Введите начальную вершину", '0'))
    let d = dijkstra(start)
    alert("Вектор расстояний до вершин: " + d)
    save(d, "Сохранить вектор?")
    let matrix = ''

    for (let i = 0; i < nodes.size; i++)
        matrix += dijkstra(i) + '\n'

    alert("Матрица расстояний от каждой вершины до каждой:\n" + matrix)
    save(matrix, "Сохранить матрицу?")
}

function task6(needCenter = false) {
    let n = nodes.size, inf = Number.MAX_VALUE
    let d = getAdjMatrix(), e = Array(n).fill(0)
    let c = new Set(), rad = Number.MAX_VALUE, diam = 0

    for (let k = 0; k < n; k++) {
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                if (d[i][j] === 0)
                    d[i][j] = inf

                if (d[i][k] === 0)
                    d[i][k] = inf

                if (d[k][j] === 0)
                    d[k][j] = inf

                d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j])
            }
        }
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            e[i] = Math.max(e[i], d[i][j])
        }
    }

    for (let i = 0; i < n; i++) {
        rad = Math.min(rad, e[i])
        diam = Math.max(diam, e[i])
    }

    for (let i = 0; i < n; i++) {
        if (e[i] === rad) {
            c.add(i)
        }
    }

    if (needCenter)
        return {center: c, diam: d}

    let degrees = Array(n).fill(0)
    for (let [node1, nodes1] of nodes)
        for (let node2 of nodes1.values())
            if (node1 !== node2)
                degrees[node1]++
            else
                degrees[node2] += 2

    let text
    if (rad === Number.MAX_VALUE)
        text = "У графа нет радиуса и диаметра.\nВектор степеней: " + degrees
    else
        text = "Радиус графа: " + rad + "\nДиаметр графа: " + diam + "\nВектор степеней: " + degrees

    alert(text)
    save(text, "Сохранить данные?")
}



function task9() {
    let isFull = true, lists = getAdjLists()
    for (let list of lists)
        if (list.length !== lists.length) {
            isFull = false
            break
        }

    addHistoryCommand({
        undo: () => {
            let listsNew = getAdjLists()
            for (let i = 0; i < listsNew.length; i++)
                for (let j = 0; j < listsNew.length; j++)
                    if (i !== j && listsNew[i].includes(j) && !lists[i].includes(j) && Array.from(nodes.get(i).keys()).includes(j))
                        deleteEdge(i, j)
        },
        redo: () => {
            if (isFull) {
                alert("Граф полный")
            } else {
                for (let i = 0; i < lists.length; i++)
                    for (let j = 0; j < lists.length; j++)
                        if (i !== j && !lists[i].includes(j) && !Array.from(nodes.get(j).keys()).includes(i)) {
                            addEdge(i, j, 1)
                            getCurve(i, j).stroke('green')
                        }
            }
        }
    }).redo()
}

function task13() {
    let g = [], x, y, res = [], cost = 0
    for (let i = 1; i < trs.length; i++) {
        for (let j = i; j < trs[i].cells.length; j++) {
            x = trs[i].cells[j].textContent
            y = trs[j].cells[i].textContent

            if (x !== '0' || y !== '0') {
                g.push({
                    weight: parseInt(x),
                    first: i - 1,
                    second: j - 1
                })
            }
        }
    }

    g.sort((a, b) => a.weight < b.weight ? -1 : (a.weight > b.weight ? 1 : 0))
    let tree_id = Array(nodes.size)
    for (let i = 0; i < tree_id.length; i++)
        tree_id[i] = i

    for (let i = 0; i < g.length; i++) {
        let a = g[i].first, b = g[i].second, l = g[i].weight
        if (tree_id[a] !== tree_id[b]) {
            cost += l
            res.push({
                first: a,
                second: b,
                weight: l
            })
            let old_id = tree_id[b], new_id = tree_id[a]
            for (let j = 0; j < nodes.size; ++j)
                if (tree_id[j] === old_id)
                    tree_id[j] = new_id
        }
    }

    addHistoryCommand({
        undo: () => {
            for (let i = 0; i < g.length; i++) {
                if (nodes.get(g[i].first).get(g[i].second) === undefined ||
                    nodes.get(g[i].second).get(g[i].first) === undefined)
                    addEdge(g[i].first, g[i].second, g[i].weight)
            }
        },
        redo: () => {
            let lists = getAdjLists()
            for (let i = 0; i < lists.length; i++)
                for (let j = 0; j < lists.length; j++)
                    if (i !== j && lists[i].includes(j) && Array.from(nodes.get(i).keys()).includes(j))
                        deleteEdge(i, j)

            for (let edge of res)
                addEdge(edge.first, edge.second, edge.weight)
        }
    }).redo()
}

function task14() {
    let color = Array(nodes.size).fill(0), catalogCycles = [], E = [], G = getAdjLists(), find = false

    for (let i = 0; i < G.length; i++)
        for (let j = 0; j < G[i].length; j++) {
            E.push({
                v1: i,
                v2: G[i][j]
            })

            if (G[G[i][j]].includes(i))
                G[G[i][j]].splice(G[G[i][j]].indexOf(i), 1)
        }

    function DFSCycle(fromNode, toNode, colors, unavailableEdge, cycle) {
        if (fromNode !== toNode)
            colors[fromNode] = 2
        else if (cycle.length >= 2) {
            let currentCycle = []
            for (let i = 0; i < cycle.length; i++)
                currentCycle.push(cycle[i])

            catalogCycles.push(currentCycle)
            if (currentCycle.length === 4)
                find = true

            return
        }

        for (let w of E) {
            if (w === unavailableEdge)
                continue

            if (colors[w.v2] === 1 && w.v1 === fromNode) {
                let cycleNEW = cycle.slice()
                cycleNEW.push(w.v2)
                DFSCycle(w.v2, toNode, colors, w, cycleNEW)
                if (find)
                    return
                colors[w.v2] = 1
            } else if (colors[w.v1] === 1 && w.v2 === fromNode /*&& !w.IsOriented*/) {
                let cycleNEW = cycle.slice()
                cycleNEW.push(w.v1)
                DFSCycle(w.v1, toNode, colors, w, cycleNEW)
                if (find)
                    return
                colors[w.v1] = 1
            }
        }
    }

    for (let i = 0; i < nodes.size; i++) {
        color = Array(nodes.size).fill(1)
        let cycle = []
        cycle.push(i)
        DFSCycle(i, i, color, -1, cycle)
    }

    let min = nodes.size + 1, idx = -1, idxMax
    catalogCycles.find((el, id, arr) => {
        if (el.length < min && el.length !== 2) {
            min = el.length
            idx = id
        } else if (el.length !== 2)
            idxMax = id
    })

    if (catalogCycles.length === 0) {
        let answer = task6(true)
        alert("Граф ацикличен.\nЦентр дерева: " + Array.from(answer.center) + "\n"
            + "Глубина дерева: " + answer.diam)
    } else if (idx !== -1) {
        paintCommand(catalogCycles[idx], false, "Минимальный цикл: ")
    } else {
        paintCommand(catalogCycles[idxMax], false, "Минимальный цикл: ")
    }
}



function trick(from, to) {
    from = nodesDrawn.get(from)
    to = nodesDrawn.get(to)
    return Math.sqrt(Math.pow(from.x() - to.x(), 2) + Math.pow(from.y() - to.y(), 2))
}

function aStar(from, to) {
    let graph = getMapEdges(nodes)
    let queue = new PriorityQueue()
    let cameFrom = new Map()
    let cost = new Map()
    queue.push(from, 0)
    cameFrom.set(from, undefined)
    cost.set(from, 0)
    let cur
    while (!queue.isEmpty()) {
        cur = queue.pop()
        if (cur === to)
            break

        for (const pair of graph.get(cur)) {
            let newCost = cost.get(cur) + pair.cost;
            if (!cost.has(pair.to) || newCost < cost.get(pair.to)) {
                cost.set(pair.to, newCost)
                queue.push(pair.to, trick(to, pair.to) + newCost)
                cameFrom.set(pair.to, cur)
            }
        }
    }

    //cost = cost.get(to)
    let sum = 0
    let pathArr = [to]
    while (cameFrom.get(to) !== undefined) {
        sum += nodes.get(to).get(cameFrom.get(to))[0]
        pathArr.push(cameFrom.get(to))
        to = cameFrom.get(to)
    }

    alert("Стоимость пути:" + sum)
    return pathArr.reverse()
}

function stupidMethod(matrix1, matrix2) {
    if (matrix1.length !== matrix2.length) return false;
    let shift = new Array(matrix1.length);
    let indexes = new Array(matrix1.length).fill(0);
    for (let i = 0; i < shift.length; i++) {
        shift[i] = i;
    }
    let i = 0;
    while (i < shift.length) {
        if (indexes[i] < i) {
            if (i % 2 === 0) [shift[0], shift[i]] = [shift[i], shift[0]];
            else [shift[indexes[i]], shift[i]] = [shift[i], shift[indexes[i]]];
            indexes[i]++;
            i = 0;
        } else {
            indexes[i] = 0;
            i++;
        }
        console.log(shift);
        if (compareAdjMatrix(matrix1, matrix2, shift)) return true;
    }
    return false;
}

function compareAdjMatrix(matrix1, matrix2, ind) {
    if (matrix1.length !== matrix2.length) return false;
    for (let i = 0; i < ind.length; i++) {
        for (let j = 0; j < ind.length; j++) {
            if (matrix1[i][j] !== matrix2[ind[i]][ind[j]]) return false;
        }
    }
    return true;
}

function getAdjMatrix2(graph) {
    let matrix = new Array(graph.size);
    for (let i = 0; i < matrix.length; i++) {
        matrix[i] = new Array(matrix.length).fill(0);
    }
    let i = 0;
    let keys = [...graph.keys()];
    for (const v of graph.keys()) {
        for (const pair of graph.get(v)) {
            matrix[keys.indexOf(v)][keys.indexOf(pair.to)]++;
        }
    }
    return matrix;
}

function task7() {
    if (nodes2 === undefined) {
        nodes2 = new Map()
        for (let [node1, nodes1] of nodes) {
            nodes2.set(node1, new Map())
            for (let [node2, weights] of nodes1) {
                nodes2.get(node1).set(node2, ...weights)
            }
        }

        alert(`Для проверки на изоморфизм этого графа, откройте второй граф любым предложенным способом!\nПосле снова нажмите эту кнопку.`)
    } else {
        if (stupidMethod(getAdjMatrix2(getMapEdges(nodes2)), getAdjMatrix2(getMapEdges(nodes))))
            alert("Графы изоморфны")
        else
            alert("Графы не изоморфны")
        nodes2 = undefined
    }
}