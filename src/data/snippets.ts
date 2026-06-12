import { CodeSnippet } from '../types';

export const defaultSnippets: CodeSnippet[] = [
  {
    id: 'py-easy-1',
    title: 'Python 快速排序',
    language: 'python',
    difficulty: 'easy',
    code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))`,
  },
  {
    id: 'py-medium-1',
    title: 'Python 二叉搜索树',
    language: 'python',
    difficulty: 'medium',
    code: `class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, value):
        if not self.root:
            self.root = Node(value)
            return
        self._insert_recursive(self.root, value)

    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = Node(value)
            else:
                self._insert_recursive(node.left, value)
        elif value > node.value:
            if node.right is None:
                node.right = Node(value)
            else:
                self._insert_recursive(node.right, value)`,
  },
  {
    id: 'js-easy-1',
    title: 'JavaScript 防抖函数',
    language: 'javascript',
    difficulty: 'easy',
    code: `function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const handleSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);`,
  },
  {
    id: 'js-medium-1',
    title: 'JavaScript Promise 并发控制',
    language: 'javascript',
    difficulty: 'medium',
    code: `async function promisePool(tasks, limit) {
  const results = [];
  const executing = [];
  
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}`,
  },
  {
    id: 'go-easy-1',
    title: 'Go HTTP 服务器',
    language: 'go',
    difficulty: 'easy',
    code: `package main

import (
	"fmt"
	"net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, World!")
}

func main() {
	http.HandleFunc("/hello", helloHandler)
	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}`,
  },
  {
    id: 'go-medium-1',
    title: 'Go 并发爬虫',
    language: 'go',
    difficulty: 'medium',
    code: `package main

import (
	"fmt"
	"sync"
	"time"
)

type Fetcher interface {
	Fetch(url string) (body string, urls []string, err error)
}

func Crawl(url string, depth int, fetcher Fetcher, wg *sync.WaitGroup, visited map[string]bool, mu *sync.Mutex) {
	defer wg.Done()
	if depth <= 0 {
		return
	}
	mu.Lock()
	if visited[url] {
		mu.Unlock()
		return
	}
	visited[url] = true
	mu.Unlock()

	body, urls, err := fetcher.Fetch(url)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Printf("found: %s %q\\n", url, body)
	for _, u := range urls {
		wg.Add(1)
		go Crawl(u, depth-1, fetcher, wg, visited, mu)
	}
}`,
  },
  {
    id: 'rust-easy-1',
    title: 'Rust 所有权示例',
    language: 'rust',
    difficulty: 'easy',
    code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    
    println!("{}", s2);
    
    let s3 = String::from("world");
    let s4 = s3.clone();
    
    println!("s3 = {}, s4 = {}", s3, s4);
    
    let x = 5;
    let y = x;
    
    println!("x = {}, y = {}", x, y);
}`,
  },
  {
    id: 'java-easy-1',
    title: 'Java 单例模式',
    language: 'java',
    difficulty: 'easy',
    code: `public class Singleton {
    private static volatile Singleton instance;
    private String data;
    
    private Singleton(String data) {
        this.data = data;
    }
    
    public static Singleton getInstance(String data) {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton(data);
                }
            }
        }
        return instance;
    }
    
    public String getData() {
        return data;
    }
}`,
  },
];
