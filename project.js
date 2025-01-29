// Sample data for Resource Allocation Graph
        const nodes = [
            { id: 'P1', type: 'process' },
            { id: 'P2', type: 'process' },
            { id: 'R1.1', type: 'resource', group: 'R1' },
            { id: 'R1.2', type: 'resource', group: 'R1' },
            { id: 'R2.1', type: 'resource', group: 'R2' }
        ];
        const links = [
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];
        const nodes1 = [
            { id: 'P1', type: 'process' },
            { id: 'P2', type: 'process' },
            { id: 'R1.1', type: 'resource', group: 'R1' },
            { id: 'R1.2', type: 'resource', group: 'R1' },
            { id: 'R2.1', type: 'resource', group: 'R2' }
        ];
        const links1 = [//since d3 is upadating link array rapidly we can't use that for mathematical logics there we define this array 
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];

        let yellowLinks=[
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];//global variable to store the yellow links
        let cycleLinks=[
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];//global variable to store the cycle links
        let local_iteration_cycle_links=[
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];

        //toggling features 
        let isHold = false;
        let isCycle = false;
        
        function clac_cycle_edges(){
            yellowLinks=[];
            cycleLinks=[];
            local_iteration_cycle_links=[];
            calc_hold_wait_edges();
            //calc_hold_wait_edges();//re-calcuate the hold-wait edges
            for(let link of yellowLinks){//all cycle edgeds will be an hold-wait edge but not vice-versa 
                const sourceNode = nodes1.find(node => node.id === link.source.id || node.id === link.source);
                const targetNode = nodes1.find(node => node.id === link.target.id || node.id === link.target);

                let new_source_node = nodes1.find(node => node.id === link.target.id || node.id === link.target);
                local_iteration_cycle_links=[];
                local_iteration_cycle_links.push(link);
                while(true){
                    const new_edge = yellowLinks.find(link=> link.source===new_source_node.id || link.source.id===new_source_node.id )
                    if(new_edge !== undefined){
                        if(new_edge.target===sourceNode.id || new_edge.target.id===sourceNode.id){//cycle end edge found
                            local_iteration_cycle_links.push(new_edge);
                            for(let link1 of local_iteration_cycle_links){//copy all the elements from local cycle array to cycle array used globally 
                                cycleLinks.push(link1)
                            }

                            break;
                        }
                        else{//if its a middle way edge in a cycle 
                            new_source_node=nodes1.find(node=>node.id===new_edge.target || node.id===new_edge.target.id)
                            continue;
                        }
                    }
                    else{//if not found continuing cycle 
                        break;
                    }
                }
            }
            // Remove duplicates
            cycleLinks = cycleLinks.filter((value, index, self) => 
                index === self.findIndex((t) => (
                    t.source === value.source && t.target === value.target
                ))
            );
            console.log("cycleLinks -local : " , cycleLinks);

        }



        function calc_hold_wait_edges(){//calculate this when adding new edge or deleting an edge 
            yellowLinks=[];//empty the yellow links and re-calculate
            for(let link of links1){
                const sourceNode = nodes.find(node => node.id === link.source.id || node.id === link.source);
                const targetNode = nodes.find(node => node.id === link.target.id || node.id === link.target);
                if(sourceNode.type==="resource" && targetNode.type==="process"){//hold wait can only from resource to process and + process to another resource
                    for (let link1 of links1){
                        if(link.target===link1.source){
                            for(let link2 of links1){
                                if(link2.source===link1.target){
                                    yellowLinks.push(link)
                                    yellowLinks.push(link1)
                                }
                            }
                        }
                        
                    }
                }
                
            }
        }





        const width = 800, height = 600;
        const svg = d3.select("#rag-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        // Add a visible boundary
        svg.append("rect")
            .attr("class", "boundary")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

        let selectedNode = null; // Track the selected node for linking
        const groupSize = 120; // Size of the resource group box

        //this code for functionality to be aaded in future perspect
        let number_of_resource_instance=0;
        for (let node of nodes) {
            if (node.type==='resource'){
                number_of_resource_instance ++;
            }
        }
        console.log(number_of_resource_instance)

        const resourceGroups = new Map(); // Store group center positions
        // Custom force to keep resources within their group
        function forceGroupContainment(alpha) {
            const strength = 0.1;
            nodes.forEach(d => {
                if (d.type === 'resource') {
                    const group = resourceGroups.get(d.group);
                    if (group) {
                        const dx = d.x - group.x;
                        const dy = d.y - group.y;
                        const r = Math.sqrt(dx * dx + dy * dy);
                        const maxR = groupSize / 2 - 20; // Adjusted to keep resources inside
                        if (r > maxR) {
                            d.x = group.x + (dx / r) * maxR;
                            d.y = group.y + (dy / r) * maxR;
                        }
                    }
                }
            });
        }

        // Create a force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.type === 'process' ? 30 : 40))
            .force("groupContainment", forceGroupContainment)

        // Add arrow markers for directional links
        svg.append("defs").html(`
        <marker id="arrow-red" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF0000"></path>
        </marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="blue"></path>
        </marker>
        
        </marker>
        `);
        

        function renderGraph() {
        cycleLinks=[];
        yellowLinks=[];
        local_iteration_cycle_links=[];
        calc_hold_wait_edges();
        clac_cycle_edges();
        // Group resources
        const groups = d3.group(nodes.filter(d => d.type === 'resource'), d => d.group);
        
        // Update resource groups positions
        groups.forEach((groupNodes, groupId) => {
            if (!resourceGroups.has(groupId)) {
                resourceGroups.set(groupId, {
                    x: width / 2 + (Math.random() - 0.5) * 200,
                    y: height / 2 + (Math.random() - 0.5) * 200
                });
            }
        });

        // Bind resource group data and draw groups
        const group = svg.selectAll(".resource-group")
            .data(Array.from(groups));

        const groupEnter = group.enter()
            .append("g")
            .attr("class", "resource-group");

        groupEnter.append("rect")
            .attr("width", groupSize)
            .attr("height", groupSize)
            .attr("x", -groupSize / 2)
            .attr("y", -groupSize / 2);

        const groupMerge = group.merge(groupEnter)
            .call(d3.drag()
                .on("start", dragstartGroup)
                .on("drag", draggedGroup)
                .on("end", dragendGroup));
        group.exit().remove();

        // Bind link data and draw links      
        const link = svg.selectAll(".link")      
            .data(links);

        link.enter()
            .append("line")
            .attr("class", "link")
            .merge(link)
            .attr("stroke", d => {
                const sourceNode = nodes.find(node => node.id === d.source.id || node.id === d.source);
                const targetNode = nodes.find(node => node.id === d.target.id || node.id === d.target);
                console.log("Cheking right now for :" , sourceNode ," -> ", targetNode)
                //CASE 1 hold-wait
                const exists = yellowLinks.some(link => 
                    (link.source.id === sourceNode.id || link.source === sourceNode.id) && 
                    (link.target.id === targetNode.id || link.target === targetNode.id)
                );
                //CASE 2 CIRCULAR-wait
                const exists1 = cycleLinks.some(link => 
                    (link.source.id === sourceNode.id || link.source === sourceNode.id) && 
                    (link.target.id === targetNode.id || link.target === targetNode.id)
                );
                console.log("exists1 : " , exists1);
                console.log("exists : " , exists);
                if(exists && (isHold && !isCycle)){return "yellow"}//apply yello to edges if the toggling view on
                else if(exists1 && ( isCycle && !isHold)){return "#00FF00"}//apply green to edges if the toggling view on for cycle 

                else if (sourceNode.type === "resource" && targetNode.type === "process") {
                    return "blue"; // Resource to Process
                }
                else if (sourceNode.type === "process" && targetNode.type === "resource") {
                    return "#FF0000";//return red
                }

            })
            .attr("stroke-width", 2) // Make edges more visible
            .attr("marker-end", d => {
                const sourceNode = nodes.find(node => node.id === d.source.id || node.id === d.source);
                const targetNode = nodes.find(node => node.id === d.target.id || node.id === d.target);
                if (sourceNode.type === "process" && targetNode.type === "resource") {
                    return "url(#arrow-red)"; // Red arrow for process to resource
                } else if (sourceNode.type === "resource" && targetNode.type === "process") {
                    return "url(#arrow-blue)"; // Blue arrow for resource to process
                }
            });
        link.exit().remove()

         //Bind node data and draw nodes
        const node = svg.selectAll(".node")
            .data(nodes);
        
        const nodeEnter = node.enter()
            .append("g")
            .attr("class", d => `node ${d.type}`)
            .on("contextmenu", handleContextMenu);
        
        // Add square nodes for resources
        nodeEnter.filter(d => d.type === 'resource')
            .append("rect")
            .attr("width", 40)
            .attr("height", 40)
            .attr("x", -20)
            .attr("y", -20)
            .attr("class", "resource-node");
        
        // Add circle nodes for processes
        nodeEnter.filter(d => d.type === 'process')
            .append("circle")
            .attr("r", 20)
            .attr("class", "process-node")
            .call(d3.drag()
                .on("start", dragstartProcess)
                .on("drag", draggedProcess)
                .on("end", dragendProcess));
        
        const nodeText = nodeEnter.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("pointer-events", "none")
            .text(d => d.id);
        
        node.select("text")
            .text(d => d.id);
        
        nodeText.merge(node.select("text"));
        nodeEnter.merge(node);
        node.exit().remove();
        
        // Restart the simulation
        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
        }
    //+++++++++++render ends here ++++++++++


        // Dragging functions for process nodes
        function dragstartProcess(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function draggedProcess(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragendProcess(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Dragging functions for resource groups
        function dragstartGroup(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d[1][0].x;
            d.fy = d[1][0].y;
        }

        function draggedGroup(event, d) {
            const dx = event.x - d[1][0].x;
            const dy = event.y - d[1][0].y;
            d[1].forEach(node => {
                node.fx = node.x + dx;
                node.fy = node.y + dy;
            });
            const group = resourceGroups.get(d[0]);
            group.x += dx;
            group.y += dy;
        }

        function dragendGroup(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d[1].forEach(node => {
                node.fx = null;
                node.fy = null;
            });
        }

        // Function to handle right-click linking
        function handleContextMenu(event, d) {
            event.preventDefault();
            if (!selectedNode) {
                selectedNode = d;
                d3.selectAll(".node").classed("highlight", node => node === selectedNode);//iski class ko highlight bna rha hai and css mai highlight class ko green krdiya ja rha hai 
            } else {
                if (selectedNode !== d) {
                    if (
                        (selectedNode.type === "process" && d.type === "resource") ||
                        (selectedNode.type === "resource" && d.type === "process")
                    ) {
                        // Check if the edge already exists
                        const existingEdgeIndex = links.findIndex(link => 
                            (link.source.id === selectedNode.id && link.target.id === d.id) ||
                            (link.source.id === d.id && link.target.id === selectedNode.id)
                        );
        
                        if (existingEdgeIndex !== -1) {
                            // If an existing edge is found, replace it with the new one
                            links[existingEdgeIndex] = { source: selectedNode.id, target: d.id };
                        } else {
                            // If no existing edge is found, add the new edge
                            links.push({ source: selectedNode.id, target: d.id });
                            links1.push({ source: selectedNode.id, target: d.id });
                        }
                        //calculate the values each time when a right click appears 
                        console.log("links : " , links);
                        console.log("links1: " , links1);
                        //calc_hold_wait_edges();
                        //console.log("yellowLinks : " , yellowLinks);
                        //clac_cycle_edges();
                        //console.log("cycleLinks-global: " , cycleLinks);
                        renderGraph();  // Re-render the graph
                    } else {
                        alert("Invalid link: Links must connect processes to resources.");
                    }
                }
                selectedNode = null;
                d3.selectAll(".node").classed("highlight", false);
            }
        }
        

        // Function to add a new process node
        function addNode() {
            const newNodeId = `P${nodes.filter(node => node.type === 'process').length + 1}`;
            const newNode = { id: newNodeId, type: 'process' };
            nodes.push(newNode);
            nodes1.push(newNode);
            console.log("nodes : " , nodes);
            console.log("nodes1: " , nodes1);
            
            renderGraph();
        }

        // Function to add a new resource node
        function addResource() {
            const resourceNumbers = nodes
                .filter(node => node.type === 'resource')
                .map(node => parseInt(node.id.split('.')[0].substring(1)));
            const newResourceNumber = Math.max(...resourceNumbers, 0) + 1;
            const newResourceId = `R${newResourceNumber}.1`;
            const newResource = { id: newResourceId, type: 'resource', group: `R${newResourceNumber}` };
            nodes.push(newResource);
            nodes1.push(newResource);
            console.log("nodes : " , nodes);
            console.log("nodes1: " , nodes1);
            renderGraph();
        }

        // Function to add a new resource instance
        function addResourceInstance() {
            const resourceNumber = prompt("Enter the resource number:");
            if (resourceNumber) {
                const existingResources = nodes.filter(node => 
                    node.type === 'resource' && node.id.startsWith(`R${resourceNumber}.`)
                );
                if (existingResources.length > 0) {
                    const newInstanceNumber = existingResources.length + 1;
                    const newResourceId = `R${resourceNumber}.${newInstanceNumber}`;
                    const newResource = { id: newResourceId, type: 'resource', group: `R${resourceNumber}` };
                    nodes.push(newResource);
                    nodes1.push(newResource);
                    console.log("nodes : " , nodes);
                    console.log("nodes1: " , nodes1);
                } else {
                    const newResourceId = `R${resourceNumber}.1`;
                    const newResource = { id: newResourceId, type: 'resource', group: `R${resourceNumber}` };
                    nodes.push(newResource);
                    nodes1.push(newResource);
                    console.log("nodes : " , nodes);
                    console.log("nodes1: " , nodes1);
                }
                renderGraph();
            }
        }

        //hold wait functionality  
        function show_links_hold_wait(){
            if(isHold===false){
                isHold = true;//iske aage kaam rendering kr dega 
                isCycle=false;
                alert("You have entered in HOLD-WAIT view");
            }
            else{
                isHold=false;//iske aage kaam rendering kr dega
                alert("You have been out of HOLD-WAIT view");
            }
            console.log("isHold : " , isHold)
            renderGraph();//re-render for applying the view
        }
        function show_links_circular_wait(){
            console.log("the calculation is correct check further functionality");
            
            if(isCycle===false){
                isCycle = true;//iske aage kaam rendering kr dega 
                isHold=false;
                alert("You have entered in CIRCULAR-WAIT view");
            }
            else{
                isCycle=false;//iske aage kaam rendering kr dega 
                alert("You have been out of CIRCULAR-WAIT view");
            }
            console.log("iscYCLE : " , isCycle)
            renderGraph();//re-render for applying the view
        }
        

        // Ensure nodes stay within the boundaries
        function applyBoundaryConstraints() {
            const margin = groupSize / 2;
            nodes.forEach(d => {
                const radius = d.type === 'process' ? 20 : 40;
                d.x = Math.max(margin, Math.min(width - margin, d.x));
                d.y = Math.max(margin, Math.min(height - margin, d.y));
            });

            resourceGroups.forEach((group) => {
                group.x = Math.max(margin, Math.min(width - margin, group.x));
                group.y = Math.max(margin, Math.min(height - margin, group.y));
            });
        }

        

        // Initial rendering of the graph
        yellowLinks=[];//just making the yelloLinks empty in start //dont delete this
        cycleLinks=[];//just making the cycleLinks empty in start //dont delete this
        local_iteration_cycle_links=[];
        renderGraph();
        
        // Update positions of links and nodes after every tick of the simulation
        simulation.on("tick", () => {
            applyBoundaryConstraints();
            
            // Update resource group positions based on their nodes
            resourceGroups.forEach((group, groupId) => {
                const groupNodes = nodes.filter(n => n.type === 'resource' && n.group === groupId);
                if (groupNodes.length > 0) {
                    group.x = d3.mean(groupNodes, d => d.x);
                    group.y = d3.mean(groupNodes, d => d.y);
                }
            });

            // Apply group containment force
            forceGroupContainment(simulation.alpha());

            // Update link positions
            svg.selectAll(".link")
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            // Update node positions
            svg.selectAll(".node")
                .attr("transform", d => `translate(${d.x},${d.y})`);

            // Update resource group positions
            svg.selectAll(".resource-group")
                .attr("transform", d => {
                    const group = resourceGroups.get(d[0]);
                    return `translate(${group.x},${group.y})`;
                });
        });
        
