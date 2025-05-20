package main

import (
	"log"
	"net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Hello, EJC!"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", helloHandler)

	addr := ":8080"
	log.Printf("starting server on %s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
