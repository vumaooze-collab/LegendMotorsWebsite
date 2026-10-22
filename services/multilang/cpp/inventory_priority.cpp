#include <algorithm>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <string>

// Advisory ranking only. It does not change stock, set prices, or enforce access.
int main(int argc, char** argv) {
    if (argc != 4) {
        std::cerr << "Usage: inventory_priority <days_in_stock> <is_published:0|1> <is_featured:0|1>\n";
        return 2;
    }
    char* end = nullptr;
    const long days = std::strtol(argv[1], &end, 10);
    if (!end || *end != '\0' || days < 0 || days > 36500) {
        std::cerr << "days_in_stock must be an integer from 0 to 36500\n";
        return 2;
    }
    const std::string publishedArg(argv[2]), featuredArg(argv[3]);
    if ((publishedArg != "0" && publishedArg != "1") ||
        (featuredArg != "0" && featuredArg != "1")) {
        std::cerr << "published and featured must be 0 or 1\n";
        return 2;
    }
    const int score = static_cast<int>(std::min(days, 90L) / 3) +
                      (publishedArg == "1" ? 10 : 0) +
                      (featuredArg == "1" ? 15 : 0);
    std::cout << "{\"score\":" << score
              << ",\"meaning\":\"advisory inventory review priority; not a sale probability\"}\n";
    return 0;
}
