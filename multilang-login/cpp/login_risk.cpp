#include <cstdlib>
#include <iostream>

// Non-security-critical example helper. It receives only a numeric signal,
// never an email, password, session token, or other personal information.
// Production rate limiting must be enforced server-side in shared storage.
int main(int argc, char** argv) {
    int failed_attempts = 0;
    if (argc > 1) {
        char* end = nullptr;
        long value = std::strtol(argv[1], &end, 10);
        if (end != argv[1] && *end == '\0' && value >= 0 && value <= 100000) {
            failed_attempts = static_cast<int>(value);
        }
    }

    int risk_score = failed_attempts >= 10 ? 100
                   : failed_attempts >= 5 ? 60
                   : failed_attempts >= 2 ? 25
                   : 0;
    std::cout << risk_score << '\n';
    return 0;
}
