from langgraph.graph import StateGraph, START, END
from app.graph.state import ChatState
from app.graph.nodes import ollama_node


def build_pipeline() -> StateGraph:
    graph = StateGraph(ChatState)

    graph.add_node("ollama", ollama_node)

    graph.add_edge(START, "ollama")
    graph.add_edge("ollama", END)

    return graph.compile()


pipeline = build_pipeline()